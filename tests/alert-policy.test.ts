import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAlertDelivery, isCadenceDue, parseAlertPreferences } from '../src/domain/notifications/alert-policy.ts';

const valid = {
  opportunity_types: ['hackathon', 'job'],
  cadence: 'daily',
  normal_alerts: true,
  provisional_alerts: false,
  quiet_hours: { start: '22:00', end: '07:00', timezone: 'UTC' },
};

test('alert preference parsing is strict and preserves provisional opt-in', () => {
  const result = parseAlertPreferences(valid);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.opportunityTypes, ['hackathon', 'job']);
  assert.equal(result.value.provisionalAlerts, false);
  assert.deepEqual(result.value.quietHours, valid.quiet_hours);
});

test('invalid alert preference fields are rejected instead of silently defaulted', () => {
  const result = parseAlertPreferences({ opportunity_types: ['hackathon', 'not-real'], cadence: 'hourly', quiet_hours: { start: 'bad', end: '07:00', timezone: 'No/Such_Zone' } });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.errors.length, 4);
});

test('quiet hours suppress delivery and provisional alerts require explicit opt-in', () => {
  const parsed = parseAlertPreferences(valid);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const quiet = evaluateAlertDelivery({ opportunityType: 'hackathon', isProvisional: false, verifiedDestination: 'member@example.com', preferences: parsed.value, now: new Date('2026-08-22T23:30:00Z') });
  const provisional = evaluateAlertDelivery({ opportunityType: 'hackathon', isProvisional: true, verifiedDestination: 'member@example.com', preferences: parsed.value, now: new Date('2026-08-22T12:00:00Z') });
  assert.deepEqual(quiet, { deliver: false, reason: 'quiet_hours' });
  assert.deepEqual(provisional, { deliver: false, reason: 'provisional_opt_out' });
});

test('cadence windows suppress duplicate daily and weekly deliveries', () => {
  const now = new Date('2026-08-24T12:00:00Z');
  assert.equal(isCadenceDue('immediate', now, now, 'UTC'), true);
  assert.equal(isCadenceDue('daily', now, new Date('2026-08-24T08:00:00Z'), 'UTC'), false);
  assert.equal(isCadenceDue('daily', now, new Date('2026-08-23T23:00:00Z'), 'UTC'), true);
  assert.equal(isCadenceDue('weekly', now, new Date('2026-08-24T08:00:00Z'), 'UTC'), false);
  assert.equal(isCadenceDue('weekly', now, new Date('2026-08-17T23:00:00Z'), 'UTC'), true);
});
