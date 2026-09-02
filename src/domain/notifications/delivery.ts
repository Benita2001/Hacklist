import type { OpportunityType } from '@/domain/opportunities/types';
import { notificationIdempotencyKey } from '../jobs/idempotency.ts';
import { evaluateAlertDelivery, type AlertPreferences } from './alert-policy.ts';

export const notificationChannels = ['email'] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationReasons = ['new_opportunity', 'registration_open', 'deadline_changed', 'material_change'] as const;
export type NotificationReason = (typeof notificationReasons)[number];

export type NotificationCandidate = {
  userId: string;
  channel: NotificationChannel;
  verifiedDestination: string | null;
  verifiedAt: string | Date | null;
  opportunityId: string;
  opportunityVersion: number;
  opportunityType: OpportunityType;
  title: string;
  summary?: string | null;
  applicationUrl?: string | null;
  isProvisional: boolean;
  reason: NotificationReason;
};

export type NotificationEnvelope = {
  version: 1;
  channel: NotificationChannel;
  destination: string;
  subject: string;
  text: string;
  opportunityId: string;
  opportunityVersion: number;
  opportunityType: OpportunityType;
  reason: NotificationReason;
};

export type NotificationOutboxPayload = {
  version: 1;
  kind: 'notification_delivery';
  idempotencyKey: string;
  envelope: NotificationEnvelope;
};

export type NotificationSuppression =
  | 'verified_destination_required'
  | 'type_not_selected'
  | 'normal_opt_out'
  | 'provisional_opt_out'
  | 'quiet_hours'
  | 'cadence_window';

export type NotificationPlan =
  | {
      status: 'suppressed';
      idempotencyKey: string;
      reason: NotificationSuppression;
    }
  | {
      status: 'queued';
      idempotencyKey: string;
      envelope: NotificationEnvelope;
      payload: NotificationOutboxPayload;
    };

function hasVerifiedDestination(candidate: NotificationCandidate): boolean {
  if (!candidate.verifiedDestination?.trim() || !candidate.verifiedAt) return false;
  const timestamp = candidate.verifiedAt instanceof Date ? candidate.verifiedAt.getTime() : Date.parse(candidate.verifiedAt);
  return Number.isFinite(timestamp);
}

function compactText(value: string | null | undefined, limit: number): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function safeApplicationUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function subjectFor(reason: NotificationReason): string {
  switch (reason) {
    case 'new_opportunity': return 'New HackList opportunity';
    case 'registration_open': return 'Registration is open';
    case 'deadline_changed': return 'HackList deadline updated';
    case 'material_change': return 'HackList opportunity updated';
  }
}

function buildEnvelope(candidate: NotificationCandidate, idempotencyKey: string): NotificationEnvelope {
  const title = compactText(candidate.title, 240) || 'HackList opportunity update';
  const summary = compactText(candidate.summary, 600);
  const applicationUrl = safeApplicationUrl(candidate.applicationUrl);
  const lines = [subjectFor(candidate.reason), '', title];
  if (summary) lines.push('', summary);
  if (applicationUrl) lines.push('', `Apply: ${applicationUrl}`);
  lines.push('', `Reference: ${idempotencyKey}`);

  return {
    version: 1,
    channel: candidate.channel,
    destination: candidate.verifiedDestination!.trim(),
    subject: subjectFor(candidate.reason),
    text: lines.join('\n'),
    opportunityId: candidate.opportunityId,
    opportunityVersion: candidate.opportunityVersion,
    opportunityType: candidate.opportunityType,
    reason: candidate.reason,
  };
}

export function planNotificationDelivery(input: {
  candidate: NotificationCandidate;
  preferences: AlertPreferences;
  now: Date;
  lastDeliveredAt?: Date | null;
}): NotificationPlan {
  const { candidate } = input;
  const idempotencyKey = notificationIdempotencyKey(
    candidate.userId,
    candidate.channel,
    candidate.opportunityId,
    candidate.opportunityVersion,
    candidate.reason,
  );
  const decision = evaluateAlertDelivery({
    opportunityType: candidate.opportunityType,
    isProvisional: candidate.isProvisional,
    verifiedDestination: hasVerifiedDestination(candidate) ? candidate.verifiedDestination : null,
    preferences: input.preferences,
    now: input.now,
    lastDeliveredAt: input.lastDeliveredAt,
  });
  if (!decision.deliver) return { status: 'suppressed', idempotencyKey, reason: decision.reason };

  const envelope = buildEnvelope(candidate, idempotencyKey);
  return {
    status: 'queued',
    idempotencyKey,
    envelope,
    payload: { version: 1, kind: 'notification_delivery', idempotencyKey, envelope },
  };
}

export type NotificationProviderResult =
  | { outcome: 'accepted'; providerMessageId: string }
  | { outcome: 'temporary_failure'; errorCategory: 'transient' | 'rate_limited' }
  | { outcome: 'permanent_failure'; errorCategory: 'policy' | 'malformed_data' }
  | { outcome: 'unknown_outcome'; errorCategory: 'unknown_outcome' };

export type NotificationProvider = {
  channel: NotificationChannel;
  send(input: { envelope: NotificationEnvelope; idempotencyKey: string; signal?: AbortSignal }): Promise<NotificationProviderResult>;
};

export type DeliveryDisposition =
  | { status: 'sent'; providerMessageId: string }
  | { status: 'retry'; errorCategory: 'transient' | 'rate_limited'; nextAttempt: number }
  | { status: 'dead_letter'; errorCategory: 'transient' | 'rate_limited' | 'policy' | 'malformed_data' }
  | { status: 'manual_reconciliation'; errorCategory: 'unknown_outcome' };

export function classifyDeliveryResult(result: NotificationProviderResult, attemptCount: number, maxAttempts = 3): DeliveryDisposition {
  switch (result.outcome) {
    case 'accepted': return { status: 'sent', providerMessageId: result.providerMessageId };
    case 'unknown_outcome': return { status: 'manual_reconciliation', errorCategory: result.errorCategory };
    case 'permanent_failure': return { status: 'dead_letter', errorCategory: result.errorCategory };
    case 'temporary_failure':
      return attemptCount < maxAttempts
        ? { status: 'retry', errorCategory: result.errorCategory, nextAttempt: attemptCount + 1 }
        : { status: 'dead_letter', errorCategory: result.errorCategory };
  }
}
