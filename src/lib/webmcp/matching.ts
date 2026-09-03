import type { Hackathon } from '@/lib/types';
import { normalizeCountry, reusableCountrySets } from './countries.ts';
import {
  getIntelligenceById,
  type DataConfidence,
  type EligibilityRule,
  type EligibilityStatus,
  type Fact,
  type FitClassification,
  type FitStatus,
  type HackathonIntelligence,
} from './intelligence.ts';

export type BuilderProfile = {
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
  minimumPrize?: number;
  hasExistingProject?: boolean;
};

export type MatchDimension = {
  status: EligibilityStatus | FitStatus;
  reason: string;
  matched?: string[];
  missing?: string[];
  sourceUrls?: string[];
};

export type HackathonMatch = {
  hackathonId: string;
  name: string;
  organizer: string;
  fit: FitClassification;
  confidence: DataConfidence;
  score: number;
  hardFailures: string[];
  reasonCodes: string[];
  summary: string;
  dimensions: {
    eligibility: MatchDimension;
    technologyFit: MatchDimension;
    skillFit: MatchDimension;
    themeFit: MatchDimension;
    formatFit: MatchDimension;
    timeFeasibility: MatchDimension;
    submissionBurden: MatchDimension;
    existingProjectPolicy: MatchDimension;
    dataCompleteness: MatchDimension;
  };
  hackathon: Hackathon;
  intelligence: HackathonIntelligence | null;
};

export type ComparisonResult = {
  comparedAt: string;
  profile?: BuilderProfile;
  items: HackathonMatch[];
  recommendation: {
    hackathonId: string | null;
    reason: string;
    tradeoffs: string[];
  };
};

const oneDayMs = 24 * 60 * 60 * 1000;

function lowerSet(values: string[] = []): Set<string> {
  return new Set(values.map((value) => value.toLowerCase()));
}

function sourceUrls<T>(fact: Fact<T>): string[] {
  return fact.sources.map((source) => source.url);
}

function knownValues(fact: Fact<string[]>): string[] {
  return fact.status === 'KNOWN' ? fact.value : [];
}

function overlap(profileValues: string[] = [], targetValues: string[] = []) {
  const profile = lowerSet(profileValues);
  const matched = targetValues.filter((value) => profile.has(value.toLowerCase()));
  const missing = profileValues.filter((value) => !targetValues.some((target) => target.toLowerCase() === value.toLowerCase()));
  return { matched, missing };
}

function includesAvoided(values: string[], avoid: string[] = []): string[] {
  const haystack = values.join(' ').toLowerCase();
  return avoid.filter((term) => haystack.includes(term.toLowerCase()));
}

function maxKnownUsdAmount(values: string[]): number | null {
  const text = values.join(' ');
  const matches = [...text.matchAll(/(?:\$|USD\s*)\s*([0-9][0-9,]*(?:\.[0-9]+)?)(\s*[kKmM])?/g)];
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

function daysUntil(deadline: string | null, now: Date): number | null {
  if (!deadline) return null;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - now.getTime()) / oneDayMs);
}

function evaluateEligibility(rule: EligibilityRule, profile: BuilderProfile): { status: EligibilityStatus; reason: string } {
  const countryCode = profile.countryCode ?? normalizeCountry(profile.country);
  if (!countryCode) {
    return { status: 'UNKNOWN', reason: 'Country was not provided or could not be normalized, so personal eligibility cannot be confirmed.' };
  }

  if (rule.excludedCountryCodes?.includes(countryCode)) {
    return { status: 'FAIL', reason: `${countryCode} is explicitly excluded by verified organizer rules.` };
  }

  if (rule.type === 'WORLDWIDE') {
    return { status: 'PASS', reason: `${countryCode} is eligible under verified worldwide eligibility rules.` };
  }

  if (rule.type === 'EXCLUDED_COUNTRIES') {
    return { status: 'PASS', reason: `${countryCode} is not listed in the verified country or jurisdiction exclusions.` };
  }

  if (rule.type === 'INCLUDED_COUNTRIES') {
    if (!rule.includedCountryCodes?.length) return { status: 'UNKNOWN', reason: 'Included country list is not available.' };
    return rule.includedCountryCodes.includes(countryCode)
      ? { status: 'PASS', reason: `${countryCode} is included by verified organizer rules.` }
      : { status: 'FAIL', reason: `${countryCode} is not included by verified organizer rules.` };
  }

  if (rule.type === 'SUPPORTED_COUNTRY_SET') {
    const countrySet = rule.supportedCountrySet ? reusableCountrySets[rule.supportedCountrySet] : null;
    if (!countrySet) return { status: 'UNKNOWN', reason: 'Referenced supported-country set is not available locally.' };
    return countrySet.has(countryCode)
      ? { status: 'PASS', reason: `${countryCode} is in the reviewed supported-country set and not explicitly excluded.` }
      : { status: 'UNKNOWN', reason: `${countryCode} is not in the locally reviewed supported-country subset; verify the authoritative eligibility source before treating this as pass or fail.` };
  }

  if (rule.type === 'REGION_ONLY') {
    return { status: 'UNKNOWN', reason: `Eligibility is region-scoped${rule.region ? ` to ${rule.region}` : ''}; this profile needs manual verification.` };
  }

  if (rule.type === 'IN_PERSON_LOCATION_REQUIRED') {
    return { status: 'UNKNOWN', reason: 'Opportunity requires in-person location eligibility or travel; this profile needs manual verification.' };
  }

  return { status: 'UNKNOWN', reason: rule.notes };
}

function confidenceFor(intelligence: HackathonIntelligence | null): DataConfidence {
  if (!intelligence) return 'LOW';
  const facts = [
    intelligence.technologies,
    intelligence.relevantSkills,
    intelligence.themes,
    intelligence.geographicEligibility,
    intelligence.teamRules,
    intelligence.existingProjectPolicy,
    intelligence.hardwareRequirement,
    intelligence.submissionRequirements,
    intelligence.technicalRequirements,
    intelligence.prizeValue,
    intelligence.deadline,
  ];
  const unknownCount = facts.filter((fact) => fact.status === 'UNKNOWN').length + intelligence.importantUnknowns.length;
  if (unknownCount <= 1) return 'HIGH';
  if (unknownCount <= 4) return 'MEDIUM';
  return 'LOW';
}

function submissionBurden(requirements: string[]): FitStatus {
  const text = requirements.join(' ').toLowerCase();
  if (text.includes('app store') || text.includes('mainnet') || text.includes('real mainnet payment')) return 'RISKY';
  if (requirements.length >= 5) return 'RISKY';
  if (requirements.length >= 3) return 'OK';
  return 'STRONG';
}

export function evaluateHackathon(hackathon: Hackathon, profile: BuilderProfile = {}, now = new Date()): HackathonMatch {
  const intelligence = getIntelligenceById(hackathon.id);
  const hardFailures: string[] = [];
  const reasonCodes: string[] = [];
  let score = 0;

  const verifiedDeadline = intelligence?.deadline.status === 'KNOWN' ? intelligence.deadline.value : null;
  const deadlineDays = daysUntil(verifiedDeadline ?? hackathon.deadline, now);
  if (deadlineDays !== null && deadlineDays < 0) {
    hardFailures.push('EXPIRED');
    reasonCodes.push('EXPIRED');
  }

  let eligibility: MatchDimension = {
    status: 'UNKNOWN',
    reason: 'No verified eligibility intelligence is available for this hackathon.',
  };

  if (intelligence?.geographicEligibility.status === 'KNOWN') {
    const evaluated = evaluateEligibility(intelligence.geographicEligibility.value, profile);
    eligibility = {
      ...evaluated,
      sourceUrls: sourceUrls(intelligence.geographicEligibility),
    };
    if (evaluated.status === 'FAIL') {
      hardFailures.push('GEOGRAPHY_EXCLUDED');
      reasonCodes.push('GEOGRAPHY_EXCLUDED');
    } else if (evaluated.status === 'PASS') {
      score += 15;
      reasonCodes.push('ELIGIBILITY_PASS');
    } else {
      reasonCodes.push('ELIGIBILITY_UNKNOWN');
    }
  } else if (intelligence?.geographicEligibility.status === 'UNKNOWN') {
    eligibility = {
      status: 'UNKNOWN',
      reason: intelligence.geographicEligibility.note,
      sourceUrls: sourceUrls(intelligence.geographicEligibility),
    };
    reasonCodes.push('ELIGIBILITY_UNKNOWN');
  }

  const avoidMatches = includesAvoided([
    hackathon.name,
    hackathon.organizer,
    hackathon.description ?? '',
    hackathon.category,
    hackathon.format,
    ...(intelligence?.technologies.status === 'KNOWN' ? intelligence.technologies.value : []),
    ...(intelligence?.relevantSkills.status === 'KNOWN' ? intelligence.relevantSkills.value : []),
    ...(intelligence?.themes.status === 'KNOWN' ? intelligence.themes.value : []),
    ...(intelligence?.technicalRequirements.status === 'KNOWN' ? intelligence.technicalRequirements.value : []),
    ...(intelligence?.submissionRequirements.status === 'KNOWN' ? intelligence.submissionRequirements.value : []),
  ], profile.avoid);

  if (avoidMatches.length) {
    hardFailures.push('AVOIDED_CONSTRAINT');
    reasonCodes.push('AVOIDED_CONSTRAINT');
  }

  const knownPrizeAmount = profile.minimumPrize === undefined ? null : maxKnownUsdAmount([
    hackathon.prize_pool ?? '',
    intelligence?.prizeValue.status === 'KNOWN' ? intelligence.prizeValue.value : '',
  ]);

  if (profile.minimumPrize !== undefined && knownPrizeAmount !== null && knownPrizeAmount < profile.minimumPrize) {
    hardFailures.push('PRIZE_BELOW_MINIMUM');
    reasonCodes.push('PRIZE_BELOW_MINIMUM');
  }

  const targetTechnologies = intelligence ? knownValues(intelligence.technologies) : [];
  const tech = overlap([...(profile.technologies ?? []), ...(profile.skills ?? [])], targetTechnologies);
  const hasTechnologyEvidence = Boolean(intelligence);
  const technologyFit: MatchDimension = {
    status: hasTechnologyEvidence ? tech.matched.length >= 2 ? 'STRONG' : tech.matched.length === 1 ? 'OK' : 'WEAK' : 'UNKNOWN',
    reason: !hasTechnologyEvidence ? 'No verified technology intelligence is available for this HackList record.' : tech.matched.length ? `Matched technology signals: ${tech.matched.join(', ')}.` : 'No verified technology overlap was found.',
    matched: tech.matched,
    missing: tech.missing,
    sourceUrls: intelligence ? sourceUrls(intelligence.technologies) : [],
  };
  score += technologyFit.status === 'STRONG' ? 25 : technologyFit.status === 'OK' ? 12 : 0;
  if (technologyFit.status === 'WEAK') reasonCodes.push('TECHNOLOGY_MISMATCH');
  else reasonCodes.push('TECHNOLOGY_MATCH');

  const skills = overlap(profile.skills, intelligence ? knownValues(intelligence.relevantSkills) : []);
  const skillFit: MatchDimension = {
    status: intelligence ? skills.matched.length >= 2 ? 'STRONG' : skills.matched.length === 1 ? 'OK' : 'WEAK' : 'UNKNOWN',
    reason: !intelligence ? 'No verified skill intelligence is available for this HackList record.' : skills.matched.length ? `Matched skills: ${skills.matched.join(', ')}.` : 'No verified skill overlap was found.',
    matched: skills.matched,
    missing: skills.missing,
    sourceUrls: intelligence ? sourceUrls(intelligence.relevantSkills) : [],
  };
  score += skillFit.status === 'STRONG' ? 20 : skillFit.status === 'OK' ? 10 : 0;
  if (technologyFit.status !== 'WEAK' && skillFit.status === 'STRONG') {
    score += 8;
    reasonCodes.push('TECH_SKILL_COMPLEMENT');
  }

  const themes = overlap(profile.interests, intelligence ? knownValues(intelligence.themes) : [hackathon.category]);
  const themeFit: MatchDimension = {
    status: themes.matched.length ? 'OK' : profile.interests?.length ? 'WEAK' : 'UNKNOWN',
    reason: themes.matched.length ? `Matched themes: ${themes.matched.join(', ')}.` : 'No explicit theme preference matched verified themes.',
    matched: themes.matched,
    missing: themes.missing,
    sourceUrls: intelligence ? sourceUrls(intelligence.themes) : [],
  };
  score += themeFit.status === 'OK' ? 8 : 0;

  const preferredFormats = profile.preferredFormats?.length ? profile.preferredFormats : ['Any'];
  const formatFit: MatchDimension = {
    status: preferredFormats.includes('Any') || preferredFormats.includes(hackathon.format) ? 'STRONG' : hackathon.format === 'Hybrid' && preferredFormats.includes('Online') ? 'OK' : 'WEAK',
    reason: preferredFormats.includes('Any') ? `${hackathon.format} format is acceptable.` : `User prefers ${preferredFormats.join(', ')}; hackathon format is ${hackathon.format}.`,
  };
  score += formatFit.status === 'STRONG' ? 10 : formatFit.status === 'OK' ? 5 : 0;
  if (formatFit.status === 'WEAK') reasonCodes.push('FORMAT_MISMATCH');

  const availableDays = profile.availableDays;
  const timeFeasibility: MatchDimension = (() => {
    if (deadlineDays === null) {
      reasonCodes.push('DEADLINE_UNKNOWN');
      return { status: 'UNKNOWN', reason: 'Deadline could not be converted into a deterministic date.' };
    }
    if (deadlineDays < 0) return { status: 'FAIL', reason: 'Deadline has already passed.' };
    if (availableDays !== undefined && deadlineDays <= availableDays) {
      reasonCodes.push('DEADLINE_RISK');
      return { status: 'RISKY', reason: `Deadline is within ${deadlineDays} day(s), matching or under the provided availability.` };
    }
    if (deadlineDays <= 2) {
      reasonCodes.push('DEADLINE_RISK');
      return { status: 'RISKY', reason: `Deadline is soon: ${deadlineDays} day(s) away.` };
    }
    score += 10;
    return { status: 'OK', reason: `Deadline is ${deadlineDays} day(s) away.` };
  })();

  const existingProjectPolicy: MatchDimension = (() => {
    if (!intelligence) return { status: 'UNKNOWN', reason: 'Existing-project policy is not available.' };
    if (intelligence.existingProjectPolicy.status === 'UNKNOWN') {
      reasonCodes.push('EXISTING_PROJECT_POLICY_UNKNOWN');
      return { status: 'UNKNOWN', reason: intelligence.existingProjectPolicy.note, sourceUrls: sourceUrls(intelligence.existingProjectPolicy) };
    }
    const policy = intelligence.existingProjectPolicy.value;
    if (profile.hasExistingProject && policy === 'new_only') {
      hardFailures.push('EXISTING_PROJECT_NOT_ALLOWED');
      reasonCodes.push('EXISTING_PROJECT_NOT_ALLOWED');
      return { status: 'FAIL', reason: 'Verified rules require a newly created project.', sourceUrls: sourceUrls(intelligence.existingProjectPolicy) };
    }
    if (profile.hasExistingProject && policy === 'allowed') {
      score += 10;
      return { status: 'PASS', reason: 'Verified rules allow existing projects or meaningful extensions.', sourceUrls: sourceUrls(intelligence.existingProjectPolicy) };
    }
    if (policy === 'restricted') {
      return { status: 'RISKY', reason: 'Existing work is allowed only under specific restrictions.', sourceUrls: sourceUrls(intelligence.existingProjectPolicy) };
    }
    return { status: 'PASS', reason: 'Existing-project policy does not block the provided profile.', sourceUrls: sourceUrls(intelligence.existingProjectPolicy) };
  })();

  if (profile.teamSize !== undefined && intelligence?.teamRules.status === 'KNOWN' && profile.teamSize > intelligence.teamRules.value.max) {
    hardFailures.push('TEAM_SIZE_EXCEEDS_LIMIT');
    reasonCodes.push('TEAM_SIZE_EXCEEDS_LIMIT');
  }

  if (profile.solo === true && intelligence?.teamRules.status === 'KNOWN' && !intelligence.teamRules.value.soloAllowed) {
    hardFailures.push('SOLO_NOT_ALLOWED');
    reasonCodes.push('SOLO_NOT_ALLOWED');
  }

  const requirements = intelligence?.submissionRequirements.status === 'KNOWN' ? intelligence.submissionRequirements.value : [];
  const burden = submissionBurden(requirements);
  const submissionBurdenDimension: MatchDimension = {
    status: intelligence?.submissionRequirements.status === 'UNKNOWN' ? 'UNKNOWN' : burden,
    reason: intelligence?.submissionRequirements.status === 'UNKNOWN'
      ? intelligence.submissionRequirements.note
      : burden === 'RISKY'
        ? 'Submission burden is high for a short build window.'
        : 'Submission burden appears manageable from verified requirements.',
    sourceUrls: intelligence ? sourceUrls(intelligence.submissionRequirements) : [],
  };
  score += burden === 'STRONG' ? 10 : burden === 'OK' ? 5 : 0;

  const dataConfidence = confidenceFor(intelligence);
  const dataCompleteness: MatchDimension = {
    status: dataConfidence === 'HIGH' ? 'STRONG' : dataConfidence === 'MEDIUM' ? 'OK' : 'WEAK',
    reason: intelligence ? `Data confidence is ${dataConfidence}; unknowns: ${intelligence.importantUnknowns.length}.` : 'No verified intelligence sidecar entry exists.',
  };

  if (hardFailures.length) score -= 100;
  if (dataConfidence === 'LOW') score -= 10;

  let fit: FitClassification;
  if (hardFailures.length) fit = 'WEAK_FIT';
  else if (dataConfidence === 'LOW') fit = 'INSUFFICIENT_DATA';
  else if (eligibility.status === 'UNKNOWN' && score >= 70) fit = 'POSSIBLE_FIT';
  else if (score >= 70) fit = 'STRONG_FIT';
  else if (score >= 40) fit = 'POSSIBLE_FIT';
  else fit = 'WEAK_FIT';

  return {
    hackathonId: hackathon.id,
    name: hackathon.name,
    organizer: hackathon.organizer,
    fit,
    confidence: dataConfidence,
    score,
    hardFailures,
    reasonCodes: [...new Set(reasonCodes)],
    summary: hardFailures.length
      ? `${hackathon.name} has blocking constraints for this profile: ${hardFailures.join(', ')}${avoidMatches.length ? ` (${avoidMatches.join(', ')})` : ''}.`
      : `${hackathon.name} is a ${fit.replace('_', ' ').toLowerCase()} with ${dataConfidence.toLowerCase()} data confidence.`,
    dimensions: {
      eligibility,
      technologyFit,
      skillFit,
      themeFit,
      formatFit,
      timeFeasibility,
      submissionBurden: submissionBurdenDimension,
      existingProjectPolicy,
      dataCompleteness,
    },
    hackathon,
    intelligence,
  };
}

export function matchHackathons(hackathons: Hackathon[], profile: BuilderProfile = {}, now = new Date(), limit = 5): HackathonMatch[] {
  return hackathons
    .map((hackathon) => evaluateHackathon(hackathon, profile, now))
    .filter((match) => !match.hardFailures.includes('EXPIRED'))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, Math.min(Math.max(limit, 1), 10));
}

export function compareHackathons(hackathons: Hackathon[], profile: BuilderProfile = {}, now = new Date()): ComparisonResult {
  const items = hackathons.map((hackathon) => evaluateHackathon(hackathon, profile, now)).sort((a, b) => b.score - a.score);
  const best = items.find((item) => !item.hardFailures.length && item.fit === 'STRONG_FIT') ?? null;
  const tradeoffs = items.map((item) => {
    const prize = item.intelligence?.prizeValue.status === 'KNOWN' ? item.intelligence.prizeValue.value : item.hackathon.prize_pool ?? 'UNKNOWN prize';
    return `${item.name}: ${item.fit}, score ${item.score}, prize ${prize}, deadline ${item.hackathon.deadline ?? item.hackathon.deadline_text ?? 'UNKNOWN'}.`;
  });

  return {
    comparedAt: now.toISOString(),
    profile,
    items,
    recommendation: {
      hackathonId: best?.hackathonId ?? null,
      reason: best ? `${best.name} has a strong deterministic fit for the supplied constraints.` : 'No compared hackathon earned STRONG_FIT under the supplied constraints.',
      tradeoffs,
    },
  };
}

export function buildReadiness(hackathon: Hackathon) {
  const intelligence = getIntelligenceById(hackathon.id);
  if (!intelligence) {
    return {
      hackathonId: hackathon.id,
      name: hackathon.name,
      readiness_status: 'UNKNOWN',
      known: [],
      unknown: ['Verified intelligence is not available for this HackList record.'],
      sources: [],
    };
  }

  const knownItems: Array<{ label: string; value: unknown; sourceUrls: string[] }> = [];
  const unknownItems: string[] = [...intelligence.importantUnknowns];

  const addFact = <T>(label: string, fact: Fact<T>) => {
    if (fact.status === 'KNOWN') knownItems.push({ label, value: fact.value, sourceUrls: sourceUrls(fact) });
    else unknownItems.push(`${label}: ${fact.note}`);
  };

  addFact('Submission requirements', intelligence.submissionRequirements);
  addFact('Technical requirements', intelligence.technicalRequirements);
  addFact('Eligibility', intelligence.geographicEligibility);
  addFact('Team rules', intelligence.teamRules);
  addFact('Existing project policy', intelligence.existingProjectPolicy);
  addFact('Hardware/account requirement', intelligence.hardwareRequirement);
  addFact('Deadline', intelligence.deadline);

  return {
    hackathonId: hackathon.id,
    name: hackathon.name,
    readiness_status: unknownItems.length ? 'PARTIAL' : 'KNOWN',
    known: knownItems,
    unknown: [...new Set(unknownItems)],
    sources: intelligence.sourceUrls,
  };
}
