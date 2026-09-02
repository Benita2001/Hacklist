import { randomUUID, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getServerConfig } from '@/config/env';

export function requestId(request: Request): string {
  const supplied = request.headers.get('x-request-id')?.trim();
  return supplied && /^[\x20-\x7E]{1,100}$/.test(supplied) ? supplied : randomUUID();
}

function sameSecret(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

export function authorizeInternalRequest(request: Request): NextResponse | null {
  const expected = getServerConfig().internalApiSecret;
  const provided = request.headers.get('x-hacklist-internal-secret')?.trim();

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'server_misconfigured', message: 'Internal API authentication is not configured.' },
      { status: 503 },
    );
  }

  if (!provided || !sameSecret(provided, expected)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  return null;
}

export function jsonFailure(
  error: string,
  status: number,
  id: string,
): NextResponse {
  return NextResponse.json({ ok: false, error, request_id: id }, { status });
}
