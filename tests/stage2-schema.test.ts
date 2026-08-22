import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inspectLegacyBackfill } from '../src/domain/opportunities/backfill.ts';
import { fromLegacyOpportunity } from '../src/domain/opportunities/canonical-adapter.ts';
import { isEmail, isUuid, safeReturnTo } from '../src/lib/auth-request.ts';

const migration = readFileSync('supabase/migrations/202608220002_canonical_opportunity_schema.sql', 'utf8');

test('canonical migration defines publication, evidence, review, job, and private intent records', () => {
  for (const table of [
    'sources', 'organizers', 'opportunities', 'source_observations', 'opportunity_versions',
    'field_evidence', 'review_cases', 'jobs', 'job_attempts', 'subscriptions',
    'notification_deliveries', 'opportunity_saves', 'opportunity_follows', 'audit_entries',
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(migration, /alter table public\.opportunities enable row level security/);
  assert.match(migration, /publication_state in \('provisional', 'public'\)/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
  assert.match(migration, /create policy staff_audit_all/);
});

test('legacy adapter never auto-publishes without a resolved organizer', () => {
  const row = fromLegacyOpportunity({ id: 7, name: 'Legacy Hackathon', apply_url: 'https://example.com/apply', verified: true }, { type: 'hackathon' });
  assert.equal(row.publication_state, 'review');
  assert.equal(row.lifecycle_state, 'verified');
  assert.match(row.id, /^[0-9a-f-]{36}$/);
});

test('legacy adapter can produce a public candidate only with organizer identity and evidence inputs', () => {
  const row = fromLegacyOpportunity({ id: '9f2aa8d0-2ff3-4cf4-93c4-7ccca1f4f0dd', name: 'Verified Hackathon', apply_url: 'https://example.com/apply', verified: true }, {
    type: 'hackathon',
    organizerId: '9f2aa8d0-2ff3-4cf4-93c4-7ccca1f4f0de',
    sourceObservationId: '9f2aa8d0-2ff3-4cf4-93c4-7ccca1f4f0df',
  });
  assert.equal(row.publication_state, 'public');
  assert.equal((row.confidence as Record<string, unknown>).source_observation_id, '9f2aa8d0-2ff3-4cf4-93c4-7ccca1f4f0df');
});

test('backfill dry run reports invalid rows, duplicates, and unmapped fields without writing', () => {
  const report = inspectLegacyBackfill([{
    type: 'job',
    rows: [
      { id: 'one', name: 'Job', apply_url: 'https://example.com', provider_secret: 'never persist' },
      { id: 'one' },
    ],
  }]);
  assert.equal(report.totalRows, 2);
  assert.equal(report.validRows, 1);
  assert.equal(report.invalidRows, 1);
  assert.deepEqual(report.duplicateKeys, ['job:one']);
  assert.deepEqual(report.unmappedFields, ['provider_secret']);
  assert.ok(report.warnings.length >= 2);
});

test('auth request helpers reject unsafe redirects and malformed identities', () => {
  assert.equal(safeReturnTo('/hackathon/example?save=1'), '/hackathon/example?save=1');
  assert.equal(safeReturnTo('https://evil.example'), '/');
  assert.equal(safeReturnTo('//evil.example'), '/');
  assert.equal(isEmail('member@example.com'), true);
  assert.equal(isEmail('not-an-email'), false);
  assert.equal(isUuid('9f2aa8d0-2ff3-4cf4-93c4-7ccca1f4f0dd'), true);
  assert.equal(isUuid('not-a-uuid'), false);
});
