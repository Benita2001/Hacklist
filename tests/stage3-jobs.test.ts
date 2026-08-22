import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { jobIdempotencyKey, notificationIdempotencyKey } from '../src/domain/jobs/idempotency.ts';
import { classifyJobError, replayAllowed, retryDelaySeconds } from '../src/domain/jobs/policy.ts';

const migration = readFileSync('supabase/migrations/202608220003_durable_job_evidence_plane.sql', 'utf8');

test('durable job migration has leasing, visibility, retry, dead-letter, snapshot, and outbox controls', () => {
  assert.match(migration, /add column if not exists queue_name/);
  assert.match(migration, /add column if not exists lease_token/);
  assert.match(migration, /create table if not exists public\.job_dead_letters/);
  assert.match(migration, /create table if not exists public\.observation_snapshots/);
  assert.match(migration, /create table if not exists public\.notification_outbox/);
  assert.match(migration, /for update skip locked/);
  assert.match(migration, /revoke all on function public\.claim_next_job/);
  assert.match(migration, /grant execute on function public\.claim_next_job.*service_role/);
  assert.match(migration, /grant all on public\.job_dead_letters, public\.observation_snapshots/);
  assert.match(migration, /p_retryable boolean default true/);
  assert.match(migration, /on conflict on constraint job_dead_letters_job_id_key/);
});

test('job idempotency keys are stable and distinguish queue inputs', () => {
  const first = jobIdempotencyKey('source-discovery', 'source-a', 'item-1', 'hash-a');
  assert.equal(first, jobIdempotencyKey('source-discovery', 'source-a', 'item-1', 'hash-a'));
  assert.notEqual(first, jobIdempotencyKey('source-discovery', 'source-a', 'item-1', 'hash-b'));
  assert.notEqual(first, jobIdempotencyKey('observation-processing', 'source-a', 'item-1', 'hash-a'));
  assert.equal(notificationIdempotencyKey('user', 'email', 'opportunity', 2, 'deadline_changed'), 'notification:user:email:opportunity:2:deadline_changed');
});

test('retry policy separates transient, rate-limited, malformed, and unknown outcomes', () => {
  assert.deepEqual(classifyJobError({ status: 503 }), { category: 'transient', retryable: true, safeMessage: 'transient_source_failure' });
  assert.equal(classifyJobError({ status: 429 }).category, 'rate_limited');
  assert.equal(classifyJobError({ code: 'malformed_payload' }).retryable, false);
  assert.equal(classifyJobError({ code: 'timeout_after_accept' }).category, 'unknown_outcome');
  assert.equal(retryDelaySeconds(1, 'transient'), 5);
  assert.equal(retryDelaySeconds(3, 'rate_limited'), 240);
});

test('dead-letter replay is reviewer or administrator controlled', () => {
  assert.equal(replayAllowed('reviewer'), true);
  assert.equal(replayAllowed('administrator'), true);
  assert.equal(replayAllowed('member'), false);
  assert.equal(replayAllowed('service'), false);
});
