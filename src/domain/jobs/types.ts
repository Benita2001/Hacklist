import type { Json } from '../../lib/database.types.ts';

export const jobQueues = ['source-discovery', 'observation-processing', 'review-preparation', 'enrichment', 'notification', 'dead-letter'] as const;
export type JobQueue = (typeof jobQueues)[number];

export type JobErrorCategory = 'transient' | 'rate_limited' | 'permanent' | 'policy' | 'malformed_data' | 'unknown_outcome';

export type DurableJobPayload = Record<string, Json | undefined>;

export type ClaimedJob = {
  id: string;
  queue_name: string;
  idempotency_key: string;
  payload: DurableJobPayload;
  attempt_count: number;
  lease_token: string;
  lease_expires_at: string;
};

export type JobHandlerResult = { ok: true } | { ok: false; error: unknown };
