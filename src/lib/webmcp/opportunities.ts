import { supabase } from '../supabase.ts';
import type { Hackathon } from '../types.ts';
import { mergeHackathonWithIntelligence } from './intelligence.ts';
import { buildReadiness as buildHackathonReadiness } from './matching.ts';
import { normalizeCountry } from './countries.ts';

export type OpportunityType = 'hackathon' | 'job' | 'grant' | 'bounty' | 'program';
export type OpportunityCategory = 'AI' | 'Web3' | 'Both';
export type OpportunityFit = 'STRONG_FIT' | 'POSSIBLE_FIT' | 'WEAK_FIT' | 'INSUFFICIENT_DATA';
export type DimensionStatus = 'STRONG' | 'OK' | 'WEAK' | 'RISKY' | 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_COMPARABLE';
export type ValueKind = 'prize' | 'salary' | 'grant' | 'reward' | 'stipend' | 'unknown';

type BaseRow = {
  id: string;
  description?: string | null;
  deadline: string | null;
  deadline_text: string | null;
  category: OpportunityCategory;
  apply_url: string | null;
  spotlight: boolean;
  verified: boolean;
  created_at?: string | null;
};

export type BountyRow = BaseRow & {
  name: string;
  organizer: string;
  reward: string | null;
  platform: string | null;
  bounty_type?: string | null;
};

export type GrantRow = BaseRow & {
  name: string;
  organizer: string;
  amount: string | null;
  ecosystem: string | null;
  format: string | null;
  free_to_apply: boolean;
};

export type ProgramRow = BaseRow & {
  name: string;
  organizer: string;
  stipend: string | null;
  duration: string | null;
  format: string | null;
  type: string | null;
};

export type JobRow = BaseRow & {
  title: string;
  company: string;
  salary: string | null;
  format: string | null;
  location: string | null;
  job_type?: string | null;
};

export type OpportunityValue = {
  kind: ValueKind;
  label: string;
  raw: string | null;
};

export type OpportunityReference = {
  type: OpportunityType;
  id: string;
};

export type Opportunity = {
  ref: string;
  id: string;
  type: OpportunityType;
  title: string;
  organization: string;
  description: string | null;
  deadline: string | null;
  deadlineText: string | null;
  location: string | null;
  format: string | null;
  categories: OpportunityCategory[];
  applyUrl: string | null;
  verified: boolean;
  value: OpportunityValue;
  metadata: Record<string, unknown>;
  original: Hackathon | JobRow | GrantRow | BountyRow | ProgramRow;
  intelligence?: unknown;
};

export type OpportunityProfile = {
  type?: OpportunityType;
  country?: string;
  countryCode?: string;
  skills?: string[];
  technologies?: string[];
  interests?: string[];
  availableDays?: number;
  preferredFormats?: string[];
  avoid?: string[];
  teamSize?: number;
  solo?: boolean;
  minimumValue?: number;
  hasExistingProject?: boolean;
  opportunityTypes?: OpportunityType[];
  limit?: number;
};

export type OpportunityMatch = {
  opportunityRef: string;
  id: string;
  type: OpportunityType;
  title: string;
  organization: string;
  fit: OpportunityFit;
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  hardFailures: string[];
  reasonCodes: string[];
  summary: string;
  dimensions: Record<string, {
    status: DimensionStatus;
    reason: string;
    matched?: string[];
    missing?: string[];
  }>;
  opportunity: Opportunity;
};

const opportunityTypes = new Set<OpportunityType>(['hackathon', 'job', 'grant', 'bounty', 'program']);
const categories = new Set<OpportunityCategory>(['AI', 'Web3', 'Both']);
const oneDayMs = 24 * 60 * 60 * 1000;

export function getPacificDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function normalizeString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function normalizeLimit(value: unknown, fallback = 10, max = 20): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}

export function parseJsonBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return body as Record<string, unknown>;
}

export function parseOpportunityType(value: unknown): OpportunityType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return opportunityTypes.has(normalized as OpportunityType) ? normalized as OpportunityType : null;
}

export function opportunityRef(type: OpportunityType, id: string): string {
  return `${type}:${id}`;
}

export function parseOpportunityRef(input: Record<string, unknown>): OpportunityReference | null {
  const nested = input.opportunity && typeof input.opportunity === 'object' && !Array.isArray(input.opportunity)
    ? parseJsonBody(input.opportunity)
    : null;
  const type = parseOpportunityType(nested?.type ?? input.type);
  const id = normalizeString(nested?.id ?? input.id, 100);
  if (type && id) return { type, id };

  const compound = normalizeString(input.opportunityRef, 140);
  if (!compound) return null;
  const [compoundType, ...idParts] = compound.split(':');
  const parsedType = parseOpportunityType(compoundType);
  const parsedId = idParts.join(':').trim();
  return parsedType && parsedId ? { type: parsedType, id: parsedId } : null;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

function adaptHackathon(row: Hackathon): Opportunity {
  const enriched = mergeHackathonWithIntelligence(row);
  return {
    ref: opportunityRef('hackathon', row.id),
    id: row.id,
    type: 'hackathon',
    title: row.name,
    organization: row.organizer,
    description: row.description,
    deadline: row.deadline,
    deadlineText: row.deadline_text,
    location: null,
    format: row.format,
    categories: [row.category],
    applyUrl: row.apply_url,
    verified: row.verified,
    value: { kind: 'prize', label: row.prize_pool ?? 'Undisclosed prize', raw: row.prize_pool },
    metadata: { freeToEnter: row.free_to_enter, spotlight: row.spotlight },
    original: row,
    intelligence: enriched.intelligence,
  };
}

function adaptJob(row: JobRow): Opportunity {
  return {
    ref: opportunityRef('job', row.id),
    id: row.id,
    type: 'job',
    title: row.title,
    organization: row.company,
    description: row.description ?? null,
    deadline: row.deadline,
    deadlineText: row.deadline_text,
    location: row.location,
    format: row.format,
    categories: [row.category],
    applyUrl: row.apply_url,
    verified: row.verified,
    value: { kind: 'salary', label: row.salary ?? 'Undisclosed salary', raw: row.salary },
    metadata: { jobType: row.job_type ?? null, spotlight: row.spotlight },
    original: row,
  };
}

function adaptGrant(row: GrantRow): Opportunity {
  return {
    ref: opportunityRef('grant', row.id),
    id: row.id,
    type: 'grant',
    title: row.name,
    organization: row.organizer,
    description: row.description ?? null,
    deadline: row.deadline,
    deadlineText: row.deadline_text,
    location: null,
    format: row.format,
    categories: [row.category],
    applyUrl: row.apply_url,
    verified: row.verified,
    value: { kind: 'grant', label: row.amount ?? 'Undisclosed grant amount', raw: row.amount },
    metadata: { ecosystem: row.ecosystem, freeToApply: row.free_to_apply, spotlight: row.spotlight },
    original: row,
  };
}

function adaptBounty(row: BountyRow): Opportunity {
  return {
    ref: opportunityRef('bounty', row.id),
    id: row.id,
    type: 'bounty',
    title: row.name,
    organization: row.organizer,
    description: row.description ?? null,
    deadline: row.deadline,
    deadlineText: row.deadline_text,
    location: null,
    format: row.platform,
    categories: [row.category],
    applyUrl: row.apply_url,
    verified: row.verified,
    value: { kind: 'reward', label: row.reward ?? 'Undisclosed reward', raw: row.reward },
    metadata: { platform: row.platform, bountyType: row.bounty_type ?? null, spotlight: row.spotlight },
    original: row,
  };
}

function adaptProgram(row: ProgramRow): Opportunity {
  return {
    ref: opportunityRef('program', row.id),
    id: row.id,
    type: 'program',
    title: row.name,
    organization: row.organizer,
    description: row.description ?? null,
    deadline: row.deadline,
    deadlineText: row.deadline_text,
    location: null,
    format: row.format,
    categories: [row.category],
    applyUrl: row.apply_url,
    verified: row.verified,
    value: { kind: 'stipend', label: row.stipend ?? 'Undisclosed stipend', raw: row.stipend },
    metadata: { duration: row.duration, programType: row.type, spotlight: row.spotlight },
    original: row,
  };
}

function uniqueByRef(opportunities: Opportunity[]): Opportunity[] {
  const seen = new Set<string>();
  return opportunities.filter((opportunity) => {
    if (seen.has(opportunity.ref)) return false;
    seen.add(opportunity.ref);
    return true;
  });
}

function typeDiverseSlice(opportunities: Opportunity[], limit: number): Opportunity[] {
  const byType = new Map<OpportunityType, Opportunity[]>();
  for (const opportunity of opportunities) {
    byType.set(opportunity.type, [...(byType.get(opportunity.type) ?? []), opportunity]);
  }

  const result: Opportunity[] = [];
  let added = true;
  while (result.length < limit && added) {
    added = false;
    for (const type of opportunityTypes) {
      const next = byType.get(type)?.shift();
      if (next) {
        result.push(next);
        added = true;
        if (result.length >= limit) break;
      }
    }
  }

  return result;
}

async function loadTable<T>(table: string, today = getPacificDate()): Promise<{ rows: T[]; error: string | null }> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error(`[webmcp/opportunities/${table}] Supabase error:`, error);
    return { rows: [], error: 'source_unavailable' };
  }

  return { rows: (data ?? []) as T[], error: null };
}

export async function loadActiveOpportunities(today = getPacificDate()): Promise<{ opportunities: Opportunity[]; error: string | null }> {
  const [hackathons, jobs, grants, bounties, programs] = await Promise.all([
    loadTable<Hackathon>('hackathons', today),
    loadTable<JobRow>('jobs', today),
    loadTable<GrantRow>('grants', today),
    loadTable<BountyRow>('bounties', today),
    loadTable<ProgramRow>('programs', today),
  ]);
  const firstError = [hackathons, jobs, grants, bounties, programs].find((result) => result.error)?.error ?? null;
  if (firstError) return { opportunities: [], error: firstError };

  const opportunities = uniqueByRef([
      ...hackathons.rows.map(adaptHackathon),
      ...jobs.rows.map(adaptJob),
      ...grants.rows.map(adaptGrant),
      ...bounties.rows.map(adaptBounty),
      ...programs.rows.map(adaptProgram),
    ]).sort((a, b) => {
      if (!a.deadline && !b.deadline) return a.title.localeCompare(b.title);
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime() || a.title.localeCompare(b.title);
    });

  return {
    opportunities,
    error: null,
  };
}

export async function loadOpportunityByRefs(refs: OpportunityReference[]): Promise<{ opportunities: Opportunity[]; missingRefs: string[]; error: string | null }> {
  const grouped = new Map<OpportunityType, string[]>();
  for (const ref of refs) {
    grouped.set(ref.type, [...(grouped.get(ref.type) ?? []), ref.id]);
  }

  const opportunities: Opportunity[] = [];
  const found = new Set<string>();

  async function loadIds<T>(type: OpportunityType, table: string, adapter: (row: T) => Opportunity) {
    const ids = [...new Set(grouped.get(type) ?? [])].slice(0, 10);
    if (!ids.length) return null;
    const { data, error } = await supabase.from(table).select('*').in('id', ids);
    if (error) {
      console.error(`[webmcp/opportunities/by-ref/${table}] Supabase error:`, error);
      return 'source_unavailable';
    }
    for (const row of (data ?? []) as T[]) {
      const opportunity = adapter(row);
      opportunities.push(opportunity);
      found.add(opportunity.ref);
    }
    return null;
  }

  const errors = await Promise.all([
    loadIds<Hackathon>('hackathon', 'hackathons', adaptHackathon),
    loadIds<JobRow>('job', 'jobs', adaptJob),
    loadIds<GrantRow>('grant', 'grants', adaptGrant),
    loadIds<BountyRow>('bounty', 'bounties', adaptBounty),
    loadIds<ProgramRow>('program', 'programs', adaptProgram),
  ]);
  const error = errors.find(Boolean);
  if (error) return { opportunities: [], missingRefs: refs.map((ref) => opportunityRef(ref.type, ref.id)), error };

  return {
    opportunities,
    missingRefs: refs.map((ref) => opportunityRef(ref.type, ref.id)).filter((ref) => !found.has(ref)),
    error: null,
  };
}

export function normalizeOpportunityProfile(input: Record<string, unknown>): OpportunityProfile {
  const arrayOfStrings = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 12);
  };
  const opportunityTypesInput = Array.isArray(input.opportunityTypes) ? input.opportunityTypes : input.types;
  const opportunityTypes = (arrayOfStrings(opportunityTypesInput) ?? [])
    .map((type) => parseOpportunityType(type))
    .filter((type): type is OpportunityType => Boolean(type));
  const singleType = parseOpportunityType(input.type);
  const country = normalizeString(input.country, 80) ?? undefined;
  const availableDays = typeof input.availableDays === 'number' && Number.isFinite(input.availableDays)
    ? Math.max(0, Math.min(Math.trunc(input.availableDays), 120))
    : undefined;
  const preferredFormats = arrayOfStrings(input.preferredFormats)
    ?.filter((format) => ['Online', 'In-Person', 'Hybrid', 'Remote', 'Any'].includes(format));

  return {
    country,
    countryCode: normalizeCountry(country) ?? undefined,
    type: singleType ?? undefined,
    skills: arrayOfStrings(input.skills),
    technologies: arrayOfStrings(input.technologies),
    interests: arrayOfStrings(input.interests),
    availableDays,
    preferredFormats: preferredFormats?.length ? preferredFormats : undefined,
    avoid: arrayOfStrings(input.avoid),
    teamSize: typeof input.teamSize === 'number' && Number.isFinite(input.teamSize)
      ? Math.max(1, Math.min(Math.trunc(input.teamSize), 99))
      : undefined,
    solo: typeof input.solo === 'boolean' ? input.solo : undefined,
    minimumValue: typeof input.minimumValue === 'number' && Number.isFinite(input.minimumValue)
      ? Math.max(0, Math.trunc(input.minimumValue))
      : undefined,
    hasExistingProject: typeof input.hasExistingProject === 'boolean' ? input.hasExistingProject : undefined,
    opportunityTypes: singleType ? [singleType] : opportunityTypes.length ? [...new Set(opportunityTypes)] : undefined,
    limit: normalizeLimit(input.limit, 5, 20),
  };
}

function opportunityText(opportunity: Opportunity): string {
  return [
    opportunity.title,
    opportunity.organization,
    opportunity.description ?? '',
    opportunity.type,
    opportunity.format ?? '',
    opportunity.location ?? '',
    opportunity.value.label,
    ...opportunity.categories,
    ...Object.values(opportunity.metadata).map(textOf),
  ].join(' ').toLowerCase();
}

function matchesTerm(haystack: string, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  return Boolean(normalized && haystack.includes(normalized));
}

function overlaps(terms: string[] = [], opportunity: Opportunity): { matched: string[]; missing: string[] } {
  const haystack = opportunityText(opportunity);
  return {
    matched: terms.filter((term) => matchesTerm(haystack, term)),
    missing: terms.filter((term) => !matchesTerm(haystack, term)),
  };
}

function daysUntil(deadline: string | null, now: Date): number | null {
  if (!deadline) return null;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - now.getTime()) / oneDayMs);
}

function knownUsdAmount(raw: string | null): number | null {
  if (!raw) return null;
  const matches = [...raw.matchAll(/(?:\$|USD\s*)\s*([0-9][0-9,]*(?:\.[0-9]+)?)(\s*[kKmM])?/g)];
  const amounts = matches.map((match) => {
    const base = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(base)) return null;
    const suffix = match[2]?.trim().toLowerCase();
    if (suffix === 'k') return base * 1_000;
    if (suffix === 'm') return base * 1_000_000;
    return base;
  }).filter((amount): amount is number => amount !== null);
  return amounts.length ? Math.max(...amounts) : null;
}

export function searchOpportunities(opportunities: Opportunity[], input: Record<string, unknown>) {
  const query = normalizeString(input.query, 120);
  const type = parseOpportunityType(input.type);
  const category = typeof input.category === 'string' && categories.has(input.category as OpportunityCategory) ? input.category as OpportunityCategory : null;
  const format = normalizeString(input.format, 80);
  const verifiedOnly = input.verifiedOnly === true;
  const limit = normalizeLimit(input.limit, 10, 50);

  const filtered = opportunities
    .filter((opportunity) => !type || opportunity.type === type)
    .filter((opportunity) => !category || opportunity.categories.includes(category))
    .filter((opportunity) => !format || opportunity.format?.toLowerCase() === format.toLowerCase() || opportunity.location?.toLowerCase().includes(format.toLowerCase()))
    .filter((opportunity) => !verifiedOnly || opportunity.verified)
    .filter((opportunity) => !query || matchesTerm(opportunityText(opportunity), query));

  return { query, type, category, format, verifiedOnly, limit, opportunities: type ? filtered.slice(0, limit) : typeDiverseSlice(filtered, limit) };
}

export function evaluateOpportunity(opportunity: Opportunity, profile: OpportunityProfile = {}, now = new Date()): OpportunityMatch {
  const hardFailures: string[] = [];
  const reasonCodes: string[] = [];
  let score = 0;

  const deadlineDays = daysUntil(opportunity.deadline, now);
  if (deadlineDays !== null && deadlineDays < 0) {
    hardFailures.push('EXPIRED');
    reasonCodes.push('EXPIRED');
  }

  const avoid = overlaps(profile.avoid, opportunity).matched;
  if (avoid.length) {
    hardFailures.push('AVOIDED_CONSTRAINT');
    reasonCodes.push('AVOIDED_CONSTRAINT');
  }

  const skills = overlaps(profile.skills, opportunity);
  const technologies = overlaps(profile.technologies, opportunity);
  const interests = overlaps(profile.interests, opportunity);
  const totalSignals = (profile.skills?.length ?? 0) + (profile.technologies?.length ?? 0) + (profile.interests?.length ?? 0);
  const matchedSignals = skills.matched.length + technologies.matched.length + interests.matched.length;

  const relevanceStatus: DimensionStatus = matchedSignals >= 3 ? 'STRONG' : matchedSignals >= 1 ? 'OK' : totalSignals ? 'WEAK' : 'UNKNOWN';
  score += relevanceStatus === 'STRONG' ? 35 : relevanceStatus === 'OK' ? 18 : 0;
  reasonCodes.push(relevanceStatus === 'WEAK' ? 'RELEVANCE_MISMATCH' : 'RELEVANCE_EVALUATED');

  const skillStatus: DimensionStatus = skills.matched.length >= 2 || technologies.matched.length >= 2
    ? 'STRONG'
    : skills.matched.length + technologies.matched.length === 1
      ? 'OK'
      : (profile.skills?.length || profile.technologies?.length) ? 'WEAK' : 'UNKNOWN';
  score += skillStatus === 'STRONG' ? 25 : skillStatus === 'OK' ? 12 : 0;

  const preferredFormats = profile.preferredFormats?.length ? profile.preferredFormats : ['Any'];
  const locationText = compact([opportunity.format, opportunity.location]).join(' ').toLowerCase();
  const formatMatch = preferredFormats.includes('Any') || preferredFormats.some((format) => {
    const normalized = format.toLowerCase();
    if (normalized === 'online') return locationText.includes('online') || locationText.includes('remote');
    if (normalized === 'remote') return locationText.includes('remote') || locationText.includes('online');
    return locationText.includes(normalized);
  });
  const locationStatus: DimensionStatus = formatMatch ? 'STRONG' : preferredFormats.length ? 'WEAK' : 'UNKNOWN';
  score += locationStatus === 'STRONG' ? 12 : 0;
  if (locationStatus === 'WEAK') reasonCodes.push('LOCATION_OR_FORMAT_MISMATCH');

  const timeStatus: DimensionStatus = (() => {
    if (deadlineDays === null) return 'UNKNOWN';
    if (deadlineDays < 0) return 'FAIL';
    if (profile.availableDays !== undefined && deadlineDays <= profile.availableDays) return 'RISKY';
    if (deadlineDays <= 2) return 'RISKY';
    return 'OK';
  })();
  score += timeStatus === 'OK' ? 10 : 0;
  if (timeStatus === 'RISKY') reasonCodes.push('DEADLINE_RISK');

  const amount = knownUsdAmount(opportunity.value.raw);
  const valueStatus: DimensionStatus = profile.minimumValue === undefined
    ? amount === null ? 'UNKNOWN' : 'OK'
    : amount === null
      ? 'UNKNOWN'
      : amount >= profile.minimumValue
        ? 'PASS'
        : 'FAIL';
  if (valueStatus === 'FAIL') {
    hardFailures.push('VALUE_BELOW_MINIMUM');
    reasonCodes.push('VALUE_BELOW_MINIMUM');
  } else if (valueStatus === 'PASS' || valueStatus === 'OK') {
    score += 8;
  }

  const eligibilityStatus: DimensionStatus = opportunity.type === 'hackathon' && opportunity.intelligence ? 'OK' : 'UNKNOWN';
  const confidence = opportunity.intelligence ? 'HIGH' : opportunity.description && opportunity.applyUrl ? 'MEDIUM' : 'LOW';
  if (confidence === 'LOW') score -= 10;

  if (opportunity.verified) score += 5;
  if (hardFailures.length) score -= 100;

  const hasStrongEvidence = confidence !== 'LOW' && matchedSignals >= 2 && !hardFailures.length;
  const fit: OpportunityFit = hardFailures.length
    ? 'WEAK_FIT'
    : confidence === 'LOW' || totalSignals === 0
      ? 'INSUFFICIENT_DATA'
      : hasStrongEvidence && score >= 70
        ? 'STRONG_FIT'
        : score >= 35
          ? 'POSSIBLE_FIT'
          : 'WEAK_FIT';

  return {
    opportunityRef: opportunity.ref,
    id: opportunity.id,
    type: opportunity.type,
    title: opportunity.title,
    organization: opportunity.organization,
    fit,
    score,
    confidence,
    hardFailures,
    reasonCodes: [...new Set(reasonCodes)],
    summary: hardFailures.length
      ? `${opportunity.title} has blocking constraints for this profile: ${hardFailures.join(', ')}.`
      : `${opportunity.title} is a ${fit.replace('_', ' ').toLowerCase()} ${opportunity.type} with ${confidence.toLowerCase()} data confidence.`,
    dimensions: {
      eligibility: {
        status: eligibilityStatus,
        reason: opportunity.type === 'hackathon'
          ? opportunity.intelligence ? 'Hackathon eligibility may use verified intelligence where available.' : 'No verified hackathon intelligence is available.'
          : `${opportunity.type} eligibility is not deeply enriched; use base listing details and treat applicant-specific eligibility as UNKNOWN.`,
      },
      relevance: {
        status: relevanceStatus,
        reason: matchedSignals ? `Matched profile signals: ${[...skills.matched, ...technologies.matched, ...interests.matched].join(', ')}.` : 'No explicit profile signal matched listing text or verified intelligence.',
        matched: [...skills.matched, ...technologies.matched, ...interests.matched],
        missing: [...skills.missing, ...technologies.missing, ...interests.missing],
      },
      skillTechnologyAlignment: {
        status: skillStatus,
        reason: skills.matched.length || technologies.matched.length ? 'Skill or technology terms matched listing evidence.' : 'No skill or technology overlap was found.',
        matched: [...skills.matched, ...technologies.matched],
        missing: [...skills.missing, ...technologies.missing],
      },
      availability: {
        status: timeStatus,
        reason: deadlineDays === null ? 'Deadline is UNKNOWN or rolling.' : timeStatus === 'RISKY' ? `Deadline is ${deadlineDays} day(s) away.` : `Deadline is ${deadlineDays} day(s) away.`,
      },
      locationFormat: {
        status: locationStatus,
        reason: formatMatch ? `${compact([opportunity.format, opportunity.location]).join(' / ') || 'Format'} matches preferred participation mode.` : 'Preferred participation mode did not match known format/location fields.',
      },
      value: {
        status: valueStatus,
        reason: amount === null ? `${opportunity.value.kind} value is not dollar-normalizable.` : `${opportunity.value.kind} value includes a known dollar amount.`,
      },
      dataCompleteness: {
        status: confidence === 'HIGH' ? 'STRONG' : confidence === 'MEDIUM' ? 'OK' : 'WEAK',
        reason: opportunity.intelligence ? 'Verified sidecar intelligence is available.' : 'Only base listing data is available for this category.',
      },
    },
    opportunity,
  };
}

export function matchOpportunities(opportunities: Opportunity[], input: Record<string, unknown>, now = new Date()) {
  const profile = normalizeOpportunityProfile(input);
  const allowedTypes = profile.opportunityTypes ? new Set(profile.opportunityTypes) : null;
  const sorted = opportunities
    .filter((opportunity) => !allowedTypes || allowedTypes.has(opportunity.type))
    .map((opportunity) => evaluateOpportunity(opportunity, profile, now))
    .filter((match) => !match.hardFailures.includes('EXPIRED'))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const limit = Math.min(Math.max(profile.limit ?? 5, 1), 20);
  const matches = allowedTypes ? sorted.slice(0, limit) : (() => {
    const selected: OpportunityMatch[] = [];
    for (const type of opportunityTypes) {
      const first = sorted.find((match) => match.type === type);
      if (first) selected.push(first);
    }
    for (const match of sorted) {
      if (selected.length >= limit) break;
      if (!selected.some((item) => item.opportunityRef === match.opportunityRef)) selected.push(match);
    }
    return selected.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
  })();

  return { profile, generatedAt: now.toISOString(), matches };
}

export function compareOpportunities(opportunities: Opportunity[], input: Record<string, unknown>, now = new Date()) {
  const profileInput = input.profile && typeof input.profile === 'object' && !Array.isArray(input.profile)
    ? parseJsonBody(input.profile)
    : input;
  const profile = normalizeOpportunityProfile(profileInput);
  const items = opportunities.map((opportunity) => evaluateOpportunity(opportunity, profile, now)).sort((a, b) => b.score - a.score);
  const best = items.find((item) => !item.hardFailures.length && item.fit === 'STRONG_FIT') ?? null;
  const valueKinds = new Set(items.map((item) => item.opportunity.value.kind));
  const comparability = valueKinds.size > 1
    ? 'Values are different kinds and should not be treated as equivalent.'
    : 'Values share the same kind and can be compared cautiously when amounts are known.';

  return {
    comparedAt: now.toISOString(),
    profile,
    comparability,
    items,
    recommendation: {
      opportunityRef: best?.opportunityRef ?? null,
      reason: best ? `${best.title} has a strong deterministic fit for the supplied constraints.` : 'No compared opportunity earned STRONG_FIT under the supplied constraints.',
      tradeoffs: items.map((item) => `${item.title}: ${item.type}, ${item.fit}, ${item.opportunity.value.kind} ${item.opportunity.value.label}, deadline ${item.opportunity.deadline ?? item.opportunity.deadlineText ?? 'UNKNOWN'}.`),
    },
  };
}

export function buildOpportunityReadiness(opportunity: Opportunity) {
  if (opportunity.type === 'hackathon') {
    return {
      opportunityRef: opportunity.ref,
      type: opportunity.type,
      readiness: buildHackathonReadiness(opportunity.original as Hackathon),
    };
  }

  const known = [
    { label: 'Apply URL', value: opportunity.applyUrl ?? 'UNKNOWN' },
    { label: 'Deadline', value: opportunity.deadline ?? opportunity.deadlineText ?? 'UNKNOWN' },
    { label: 'Category', value: opportunity.categories.join(', ') },
    { label: 'Format/location', value: compact([opportunity.format, opportunity.location]).join(' / ') || 'UNKNOWN' },
    { label: 'Value', value: `${opportunity.value.kind}: ${opportunity.value.label}` },
  ];
  const unknownByType: Record<Exclude<OpportunityType, 'hackathon'>, string[]> = {
    job: ['Specific application requirements', 'experience level requirements', 'known skill gaps for this user'],
    grant: ['Applicant eligibility details', 'stage restrictions', 'full application requirements'],
    bounty: ['Acceptance criteria beyond listing text', 'deliverable review process', 'full technical requirements'],
    program: ['Applicant eligibility details', 'program duration expectations beyond base listing when absent', 'full application requirements'],
  };

  return {
    opportunityRef: opportunity.ref,
    type: opportunity.type,
    readiness_status: 'PARTIAL',
    known,
    unknown: unknownByType[opportunity.type],
    sources: compact([opportunity.applyUrl]),
  };
}
