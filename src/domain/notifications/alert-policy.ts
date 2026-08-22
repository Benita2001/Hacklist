import type { OpportunityType } from '@/domain/opportunities/types';

export const alertOpportunityTypes = ['hackathon', 'bounty', 'grant', 'program', 'job'] as const satisfies readonly OpportunityType[];
export const alertCadences = ['immediate', 'daily', 'weekly'] as const;

export type AlertCadence = (typeof alertCadences)[number];
export type AlertQuietHours = {
  start: string;
  end: string;
  timezone: string;
};

export type AlertPreferences = {
  opportunityTypes: OpportunityType[];
  cadence: AlertCadence;
  normalAlerts: boolean;
  provisionalAlerts: boolean;
  quietHours: AlertQuietHours | null;
};

type ParseSuccess = { ok: true; value: AlertPreferences };
type ParseFailure = { ok: false; errors: string[] };
export type AlertPreferencesParseResult = ParseSuccess | ParseFailure;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function parseQuietHours(value: unknown): { value: AlertQuietHours | null; errors: string[] } {
  if (value === undefined || value === null || (isRecord(value) && Object.keys(value).length === 0)) {
    return { value: null, errors: [] };
  }
  if (!isRecord(value)) return { value: null, errors: ['quiet_hours must be an object'] };

  const start = value.start;
  const end = value.end;
  const timezone = value.timezone;
  const errors: string[] = [];
  if (typeof start !== 'string' || !timePattern.test(start)) errors.push('quiet_hours.start must use HH:MM');
  if (typeof end !== 'string' || !timePattern.test(end)) errors.push('quiet_hours.end must use HH:MM');
  if (typeof timezone !== 'string' || !validTimezone(timezone)) errors.push('quiet_hours.timezone must be a valid timezone');
  if (errors.length > 0) return { value: null, errors };

  return { value: { start: start as string, end: end as string, timezone: timezone as string }, errors: [] };
}

export function parseAlertPreferences(input: unknown): AlertPreferencesParseResult {
  if (!isRecord(input)) return { ok: false, errors: ['alert preferences must be an object'] };

  const errors: string[] = [];
  const rawTypes = input.opportunity_types;
  const opportunityTypes = rawTypes === undefined ? [] : Array.isArray(rawTypes) ? rawTypes : null;
  if (opportunityTypes === null) {
    errors.push('opportunity_types must be an array');
  }

  const selectedTypes = opportunityTypes
    ? [...new Set(opportunityTypes.filter((value): value is OpportunityType => typeof value === 'string' && alertOpportunityTypes.includes(value as OpportunityType)))]
    : [];
  if (opportunityTypes && selectedTypes.length !== opportunityTypes.length) errors.push('opportunity_types contains an unsupported value');

  const rawCadence = input.cadence;
  const cadence = rawCadence === undefined ? 'immediate' : rawCadence;
  if (typeof cadence !== 'string' || !alertCadences.includes(cadence as AlertCadence)) errors.push('cadence is invalid');

  const normalAlerts = input.normal_alerts === undefined ? true : input.normal_alerts;
  const provisionalAlerts = input.provisional_alerts === undefined ? false : input.provisional_alerts;
  if (typeof normalAlerts !== 'boolean') errors.push('normal_alerts must be boolean');
  if (typeof provisionalAlerts !== 'boolean') errors.push('provisional_alerts must be boolean');

  const quietHours = parseQuietHours(input.quiet_hours);
  errors.push(...quietHours.errors);
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      opportunityTypes: selectedTypes,
      cadence: cadence as AlertCadence,
      normalAlerts: normalAlerts as boolean,
      provisionalAlerts: provisionalAlerts as boolean,
      quietHours: quietHours.value,
    },
  };
}

function localParts(date: Date, timezone: string): Record<string, string> {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function minutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return (hour * 60) + minute;
}

function isWithinQuietHours(date: Date, quietHours: AlertQuietHours): boolean {
  const parts = localParts(date, quietHours.timezone);
  const current = (Number(parts.hour) * 60) + Number(parts.minute);
  const start = minutes(quietHours.start);
  const end = minutes(quietHours.end);
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function localDateKey(date: Date, timezone: string): string {
  const parts = localParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localWeekKey(date: Date, timezone: string): string {
  const dateKey = localDateKey(date, timezone);
  const utcDate = new Date(`${dateKey}T00:00:00Z`);
  const daysFromMonday = (utcDate.getUTCDay() + 6) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysFromMonday);
  return utcDate.toISOString().slice(0, 10);
}

export function isCadenceDue(cadence: AlertCadence, now: Date, lastDeliveredAt: Date | null, timezone: string): boolean {
  if (!lastDeliveredAt || cadence === 'immediate') return true;
  if (cadence === 'daily') return localDateKey(now, timezone) !== localDateKey(lastDeliveredAt, timezone);
  return localWeekKey(now, timezone) !== localWeekKey(lastDeliveredAt, timezone);
}

export type AlertDecision =
  | { deliver: true; reason: 'eligible' }
  | { deliver: false; reason: 'verified_destination_required' | 'type_not_selected' | 'normal_opt_out' | 'provisional_opt_out' | 'quiet_hours' | 'cadence_window' };

export function evaluateAlertDelivery(input: {
  opportunityType: OpportunityType;
  isProvisional: boolean;
  verifiedDestination: string | null;
  preferences: AlertPreferences;
  now: Date;
  lastDeliveredAt?: Date | null;
}): AlertDecision {
  if (!input.verifiedDestination) return { deliver: false, reason: 'verified_destination_required' };
  if (!input.preferences.opportunityTypes.includes(input.opportunityType)) return { deliver: false, reason: 'type_not_selected' };
  if (input.isProvisional && !input.preferences.provisionalAlerts) return { deliver: false, reason: 'provisional_opt_out' };
  if (!input.isProvisional && !input.preferences.normalAlerts) return { deliver: false, reason: 'normal_opt_out' };

  const quietHours = input.preferences.quietHours;
  if (quietHours && isWithinQuietHours(input.now, quietHours)) return { deliver: false, reason: 'quiet_hours' };
  if (!isCadenceDue(input.preferences.cadence, input.now, input.lastDeliveredAt ?? null, quietHours?.timezone ?? 'UTC')) {
    return { deliver: false, reason: 'cadence_window' };
  }
  return { deliver: true, reason: 'eligible' };
}
