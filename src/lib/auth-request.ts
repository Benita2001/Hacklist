import type { NextRequest } from 'next/server';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 && emailPattern.test(value.trim());
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value);
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 300 || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export function requestIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export function boundedBody(request: NextRequest, maxBytes = 16_000): boolean {
  const contentLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  return !Number.isFinite(contentLength) || contentLength <= maxBytes;
}
