import { supabase } from '@/lib/supabase';
import type { Hackathon } from '@/lib/types';
import { normalizeCountry } from './countries.ts';
import { mergeHackathonWithIntelligence } from './intelligence';
import { buildReadiness, compareHackathons, matchHackathons, type BuilderProfile } from './matching';

const categories = new Set(['AI', 'Web3', 'Both']);
const formats = new Set(['Online', 'In-Person', 'Hybrid']);

type SearchInput = {
  query?: unknown;
  category?: unknown;
  format?: unknown;
  verifiedOnly?: unknown;
  limit?: unknown;
};

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

function matchesQuery(row: Hackathon, query: string): boolean {
  const haystack = [
    row.name,
    row.organizer,
    row.description ?? '',
  ].join(' ').toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export async function loadActiveHackathons(today = getPacificDate()): Promise<{ rows: Hackathon[]; error: string | null }> {
  const { data, error } = await supabase
    .from('hackathons')
    .select('id,name,organizer,description,prize_pool,deadline,deadline_text,category,format,free_to_enter,apply_url,spotlight,verified,created_at')
    .or(`deadline.gte.${today},deadline.is.null`)
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error('[webmcp/hackathons] Supabase error:', error);
    return { rows: [], error: 'source_unavailable' };
  }

  const seen = new Set<string>();
  const rows = ((data ?? []) as Hackathon[]).filter((row) => {
    const key = `${row.name}:${row.organizer}:${row.deadline ?? row.deadline_text ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { rows, error: null };
}

export async function loadHackathonsByIds(ids: string[]): Promise<{ rows: Hackathon[]; missingIds: string[]; error: string | null }> {
  const uniqueIds = [...new Set(ids.filter(Boolean))].slice(0, 10);
  if (!uniqueIds.length) return { rows: [], missingIds: [], error: null };

  const { data, error } = await supabase
    .from('hackathons')
    .select('id,name,organizer,description,prize_pool,deadline,deadline_text,category,format,free_to_enter,apply_url,spotlight,verified,created_at')
    .in('id', uniqueIds);

  if (error) {
    console.error('[webmcp/hackathons/by-id] Supabase error:', error);
    return { rows: [], missingIds: uniqueIds, error: 'source_unavailable' };
  }

  const rows = (data ?? []) as Hackathon[];
  const found = new Set(rows.map((row) => row.id));
  return {
    rows,
    missingIds: uniqueIds.filter((id) => !found.has(id)),
    error: null,
  };
}

export function searchHackathons(rows: Hackathon[], input: SearchInput) {
  const query = normalizeString(input.query, 120);
  const category = typeof input.category === 'string' && categories.has(input.category) ? input.category : null;
  const format = typeof input.format === 'string' && formats.has(input.format) ? input.format : null;
  const verifiedOnly = input.verifiedOnly === true;
  const limit = normalizeLimit(input.limit, 10, 20);

  const hackathons = rows
    .filter((row) => !category || row.category === category)
    .filter((row) => !format || row.format === format)
    .filter((row) => !verifiedOnly || row.verified)
    .filter((row) => !query || matchesQuery(row, query))
    .slice(0, limit)
    .map(mergeHackathonWithIntelligence);

  return { query, category, format, verifiedOnly, limit, hackathons };
}

export function normalizeProfile(input: Record<string, unknown>): BuilderProfile {
  const arrayOfStrings = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 12);
  };

  const preferredFormats = arrayOfStrings(input.preferredFormats)
    ?.filter((format) => ['Online', 'In-Person', 'Hybrid', 'Any'].includes(format));

  const country = normalizeString(input.country, 80) ?? undefined;
  const availableDays = typeof input.availableDays === 'number' && Number.isFinite(input.availableDays)
    ? Math.max(0, Math.min(Math.trunc(input.availableDays), 120))
    : undefined;

  return {
    country,
    countryCode: normalizeCountry(country) ?? undefined,
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
    minimumPrize: typeof input.minimumPrize === 'number' && Number.isFinite(input.minimumPrize)
      ? Math.max(0, Math.trunc(input.minimumPrize))
      : undefined,
    hasExistingProject: typeof input.hasExistingProject === 'boolean' ? input.hasExistingProject : undefined,
  };
}

export function runMatch(rows: Hackathon[], input: Record<string, unknown>, now = new Date()) {
  const profile = normalizeProfile(input);
  const limit = normalizeLimit(input.limit, 5, 10);
  return {
    profile,
    generatedAt: now.toISOString(),
    matches: matchHackathons(rows, profile, now, limit),
  };
}

export function runCompare(rows: Hackathon[], input: Record<string, unknown>, now = new Date()) {
  return compareHackathons(rows, normalizeProfile(input.profile && typeof input.profile === 'object' ? input.profile as Record<string, unknown> : input), now);
}

export function runReadiness(row: Hackathon) {
  return buildReadiness(row);
}
