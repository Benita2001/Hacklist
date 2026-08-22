import type { JobErrorCategory } from './types.ts';

export type ClassifiedJobError = {
  category: JobErrorCategory;
  retryable: boolean;
  safeMessage: string;
};

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const value = error as Record<string, unknown>;
  return typeof value.code === 'string' ? value.code.toLowerCase() : '';
}

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const value = error as Record<string, unknown>;
  return typeof value.status === 'number' ? value.status : null;
}

export function classifyJobError(error: unknown): ClassifiedJobError {
  const code = errorCode(error);
  const status = errorStatus(error);
  if (code.includes('policy') || code.includes('robots')) return { category: 'policy', retryable: false, safeMessage: 'source_policy_rejected' };
  if (code.includes('malformed') || code.includes('invalid')) return { category: 'malformed_data', retryable: false, safeMessage: 'malformed_source_data' };
  if (code.includes('unknown') || code.includes('timeout_after_accept')) return { category: 'unknown_outcome', retryable: false, safeMessage: 'provider_outcome_unknown' };
  if (status === 429 || code.includes('rate')) return { category: 'rate_limited', retryable: true, safeMessage: 'source_rate_limited' };
  if (status === 408 || status === 425 || status === 500 || status === 502 || status === 503 || status === 504 || code.includes('timeout') || code.includes('network')) {
    return { category: 'transient', retryable: true, safeMessage: 'transient_source_failure' };
  }
  return { category: 'permanent', retryable: false, safeMessage: 'job_failed' };
}

export function retryDelaySeconds(attempt: number, category: JobErrorCategory): number {
  const base = category === 'rate_limited' ? 60 : 5;
  return Math.min(3600, base * (2 ** Math.max(0, attempt - 1)));
}

export function replayAllowed(role: string | null | undefined): boolean {
  return role === 'reviewer' || role === 'administrator';
}
