import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { classifyJobError, retryDelaySeconds } from '@/domain/jobs/policy';
import type { ClaimedJob, DurableJobPayload, JobErrorCategory, JobQueue } from '@/domain/jobs/types';
import type { NotificationProviderResult } from '@/domain/notifications/delivery';

type Client = SupabaseClient<Database>;

export async function enqueueJob(client: Client, input: {
  queue: JobQueue;
  jobType: string;
  idempotencyKey: string;
  payload: DurableJobPayload;
  sourceId?: string | null;
  maxAttempts?: number;
  visibilityTimeoutSeconds?: number;
}) {
  const { data, error } = await client.from('jobs').insert({
    queue_name: input.queue,
    job_type: input.jobType,
    source_id: input.sourceId ?? null,
    idempotency_key: input.idempotencyKey,
    payload: input.payload,
    max_attempts: input.maxAttempts ?? 3,
    visibility_timeout_seconds: input.visibilityTimeoutSeconds ?? 300,
    status: 'queued',
  }).select('*').single();
  if (!error) return { created: true, job: data };
  if (error.code !== '23505') throw error;
  const existing = await client.from('jobs').select('*').eq('idempotency_key', input.idempotencyKey).single();
  if (existing.error) throw existing.error;
  return { created: false, job: existing.data };
}

export async function claimNextJob(client: Client, queue: JobQueue, workerId: string, leaseSeconds = 300): Promise<ClaimedJob | null> {
  const { data, error } = await client.rpc('claim_next_job', {
    p_queue_name: queue,
    p_worker_id: workerId,
    p_lease_seconds: leaseSeconds,
  });
  if (error) throw error;
  return data?.[0] ? data[0] as ClaimedJob : null;
}

export async function finishJob(client: Client, input: {
  job: ClaimedJob;
  success: boolean;
  error?: unknown;
}) {
  const classified = input.success ? null : classifyJobError(input.error);
  const nextAttemptAt = classified?.retryable
    ? new Date(Date.now() + retryDelaySeconds(input.job.attempt_count, classified.category) * 1000).toISOString()
    : null;
  const { data, error } = await client.rpc('finish_job', {
    p_job_id: input.job.id,
    p_lease_token: input.job.lease_token,
    p_success: input.success,
    p_error_category: classified?.category ?? null,
    p_error_message: classified?.safeMessage ?? null,
    p_next_attempt_at: nextAttemptAt,
    p_retryable: classified?.retryable ?? true,
  });
  if (error) throw error;
  return { result: data?.[0] ?? null, classified };
}

export async function requeueExpiredJobs(client: Client, queue?: JobQueue) {
  const { data, error } = await client.rpc('requeue_expired_jobs', { p_queue_name: queue ?? null });
  if (error) throw error;
  return data ?? [];
}

export async function recordSnapshot(client: Client, input: {
  observationId: string;
  storageProvider: 'postgres' | 's3';
  storageKey: string;
  contentHash: string;
  byteSize: number;
  contentType: string;
  capturedAt: string;
  retentionUntil?: string | null;
  encryptionKeyRef?: string | null;
}) {
  const { data, error } = await client.from('observation_snapshots').insert({
    observation_id: input.observationId,
    storage_provider: input.storageProvider,
    storage_key: input.storageKey,
    content_hash: input.contentHash,
    byte_size: input.byteSize,
    content_type: input.contentType,
    captured_at: input.capturedAt,
    retention_until: input.retentionUntil ?? null,
    encryption_key_ref: input.encryptionKeyRef ?? null,
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function enqueueNotificationOutbox(client: Client, input: {
  deliveryId?: string | null;
  idempotencyKey: string;
  payload: DurableJobPayload;
}) {
  const { data, error } = await client.from('notification_outbox').insert({
    delivery_id: input.deliveryId ?? null,
    idempotency_key: input.idempotencyKey,
    payload: input.payload,
  }).select('*').single();
  if (!error) return { created: true, outbox: data };
  if (error.code !== '23505') throw error;
  const existing = await client.from('notification_outbox').select('*').eq('idempotency_key', input.idempotencyKey).single();
  if (existing.error) throw existing.error;
  return { created: false, outbox: existing.data };
}

export type ClaimedNotification = {
  id: string;
  delivery_id: string | null;
  idempotency_key: string;
  payload: DurableJobPayload;
  attempt_count: number;
  lease_token: string;
  lease_expires_at: string;
};

export async function claimNextNotification(client: Client, workerId: string, leaseSeconds = 300): Promise<ClaimedNotification | null> {
  const { data, error } = await client.rpc('claim_next_notification', {
    p_worker_id: workerId,
    p_lease_seconds: leaseSeconds,
  });
  if (error) throw error;
  return data?.[0] ? data[0] as ClaimedNotification : null;
}

export async function finishNotification(client: Client, input: {
  notification: ClaimedNotification;
  result: NotificationProviderResult;
  nextAttemptAt?: string | null;
}) {
  const outcome = input.result.outcome === 'accepted' ? 'sent'
    : input.result.outcome === 'temporary_failure' ? 'retry'
      : input.result.outcome === 'permanent_failure' ? 'dead_letter'
        : 'manual_reconciliation';
  const { data, error } = await client.rpc('finish_notification', {
    p_outbox_id: input.notification.id,
    p_lease_token: input.notification.lease_token,
    p_outcome: outcome,
    p_provider_message_id: input.result.outcome === 'accepted' ? input.result.providerMessageId : null,
    p_error_category: input.result.outcome === 'accepted' ? null : input.result.errorCategory,
    p_next_attempt_at: outcome === 'retry' ? input.nextAttemptAt ?? null : null,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export function jobErrorCategory(error: unknown): JobErrorCategory {
  return classifyJobError(error).category;
}
