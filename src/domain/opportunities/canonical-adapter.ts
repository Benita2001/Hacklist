import type { OpportunityType } from './types.ts';
import type { OpportunityRow } from '../../lib/database.types.ts';

export type LegacyOpportunityRecord = {
  id?: string | number;
  name?: string;
  title?: string;
  organizer?: string;
  description?: string | null;
  apply_url?: string | null;
  deadline?: string | null;
  prize_pool?: string | null;
  category?: string | null;
  format?: string | null;
  free_to_enter?: boolean | null;
  verified?: boolean | null;
  created_at?: string | null;
};

export type CanonicalAdapterOptions = {
  type: OpportunityType;
  organizerId?: string | null;
  sourceObservationId?: string | null;
};

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

function stableUuid(value: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return value;
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const chunks = Array.from({ length: 4 }, (_, index) => {
    hash ^= index * 374761393;
    hash = Math.imul(hash, 16777619);
    return (hash >>> 0).toString(16).padStart(8, '0');
  }).join('');
  const hex = `${chunks.slice(0, 8)}-${chunks.slice(8, 12)}-5${chunks.slice(13, 16)}-8${chunks.slice(17, 20)}-${chunks.slice(20, 32)}`;
  return hex;
}

function dateOrNull(value: unknown): string | null {
  const text = stringOrNull(value);
  if (!text) return null;
  return Number.isNaN(Date.parse(text)) ? null : text;
}

/**
 * Converts a legacy catalogue row without publishing it automatically.
 * Legacy verification is preserved as a signal, but an organizer identity and
 * evidence are still required before the canonical record can be public.
 */
export function fromLegacyOpportunity(
  row: LegacyOpportunityRecord,
  options: CanonicalAdapterOptions,
): OpportunityRow {
  const title = stringOrNull(row.name ?? row.title) ?? 'Untitled opportunity';
  const verified = row.verified === true;
  const organizerId = options.organizerId ?? null;
  const canBePublic = verified && Boolean(organizerId) && Boolean(stringOrNull(row.apply_url));
  const deadline = dateOrNull(row.deadline);
  const isClosed = Boolean(deadline && new Date(deadline).getTime() < Date.now());
  const now = new Date().toISOString();

  return {
    id: stableUuid(`${options.type}:${String(row.id ?? title)}`),
    type: options.type,
    slug: `${options.type}-${slugify(title) || `opportunity-${String(row.id ?? 'unknown')}`}`,
    title,
    organizer_id: organizerId,
    lifecycle_state: isClosed ? 'closed' : verified ? 'verified' : 'detected',
    publication_state: canBePublic ? 'public' : verified ? 'review' : 'internal',
    summary: stringOrNull(row.description),
    description: stringOrNull(row.description),
    announcement_at: null,
    registration_open_at: verified ? now : null,
    deadline_at: deadline,
    start_at: null,
    end_at: null,
    source_timezone: null,
    location: null,
    is_remote: row.format === 'Online' || row.format === 'Remote' ? true : null,
    prize_or_funding: row.prize_pool ? { legacy: row.prize_pool } : {},
    eligibility: null,
    application_url: stringOrNull(row.apply_url),
    first_detected_at: stringOrNull(row.created_at) ?? now,
    announced_at: null,
    last_verified_at: verified ? now : null,
    last_changed_at: stringOrNull(row.created_at) ?? now,
    version: 1,
    confidence: { legacy_verified: verified, source_observation_id: options.sourceObservationId ?? null },
    risk: { requires_organizer_resolution: !organizerId },
    created_at: stringOrNull(row.created_at) ?? now,
    updated_at: now,
    archived_at: null,
  };
}
