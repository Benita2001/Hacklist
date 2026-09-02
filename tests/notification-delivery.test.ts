import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyDeliveryResult, planNotificationDelivery, type NotificationCandidate } from '../src/domain/notifications/delivery.ts';
import type { AlertPreferences } from '../src/domain/notifications/alert-policy.ts';

const preferences: AlertPreferences = {
  opportunityTypes: ['hackathon', 'bounty'],
  cadence: 'immediate',
  normalAlerts: true,
  provisionalAlerts: false,
  quietHours: null,
};

const candidate: NotificationCandidate = {
  userId: 'user-1',
  channel: 'email',
  verifiedDestination: 'person@example.com',
  verifiedAt: '2026-08-22T20:00:00.000Z',
  opportunityId: 'opportunity-1',
  opportunityVersion: 4,
  opportunityType: 'hackathon',
  title: 'Safe Hackathon',
  summary: 'A verified opportunity.',
  applicationUrl: 'https://example.com/apply',
  isProvisional: false,
  reason: 'new_opportunity',
};

test('eligible delivery has stable outbox identity and plain-text envelope', () => {
  const plan = planNotificationDelivery({ candidate, preferences, now: new Date('2026-08-22T21:00:00.000Z') });
  assert.equal(plan.status, 'queued');
  if (plan.status !== 'queued') return;
  assert.equal(plan.idempotencyKey, 'notification:user-1:email:opportunity-1:4:new_opportunity');
  assert.equal(plan.payload.kind, 'notification_delivery');
  assert.match(plan.envelope.text, /Safe Hackathon/);
  assert.match(plan.envelope.text, /https:\/\/example\.com\/apply/);
  assert.doesNotMatch(plan.envelope.text, /<[^>]+>/);
  assert.equal(planNotificationDelivery({ candidate, preferences, now: new Date('2026-08-22T21:00:00.000Z') }).idempotencyKey, plan.idempotencyKey);
});

test('unverified, provisional, and non-selected candidates are suppressed before enqueue', () => {
  const unverified = planNotificationDelivery({
    candidate: { ...candidate, verifiedDestination: 'person@example.com', verifiedAt: null },
    preferences,
    now: new Date(),
  });
  assert.deepEqual(unverified, {
    status: 'suppressed',
    idempotencyKey: 'notification:user-1:email:opportunity-1:4:new_opportunity',
    reason: 'verified_destination_required',
  });

  const provisional = planNotificationDelivery({
    candidate: { ...candidate, isProvisional: true },
    preferences,
    now: new Date(),
  });
  assert.equal(provisional.status, 'suppressed');
  if (provisional.status === 'suppressed') assert.equal(provisional.reason, 'provisional_opt_out');

  const notSelected = planNotificationDelivery({
    candidate: { ...candidate, opportunityType: 'grant' },
    preferences,
    now: new Date(),
  });
  assert.equal(notSelected.status, 'suppressed');
  if (notSelected.status === 'suppressed') assert.equal(notSelected.reason, 'type_not_selected');
});

test('provider outcomes protect against duplicate sends and unsafe timeout retries', () => {
  assert.deepEqual(classifyDeliveryResult({ outcome: 'accepted', providerMessageId: 'provider-1' }, 1), {
    status: 'sent', providerMessageId: 'provider-1',
  });
  assert.deepEqual(classifyDeliveryResult({ outcome: 'temporary_failure', errorCategory: 'transient' }, 1), {
    status: 'retry', errorCategory: 'transient', nextAttempt: 2,
  });
  assert.deepEqual(classifyDeliveryResult({ outcome: 'temporary_failure', errorCategory: 'rate_limited' }, 3), {
    status: 'dead_letter', errorCategory: 'rate_limited',
  });
  assert.deepEqual(classifyDeliveryResult({ outcome: 'unknown_outcome', errorCategory: 'unknown_outcome' }, 1), {
    status: 'manual_reconciliation', errorCategory: 'unknown_outcome',
  });
  assert.deepEqual(classifyDeliveryResult({ outcome: 'permanent_failure', errorCategory: 'policy' }, 1), {
    status: 'dead_letter', errorCategory: 'policy',
  });
});
