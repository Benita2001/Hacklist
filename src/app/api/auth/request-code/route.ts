import { NextRequest, NextResponse } from 'next/server';
import { getPublicConfig } from '@/config/env';
import { boundedBody, isEmail, requestIp, safeReturnTo } from '@/lib/auth-request';
import { requestId } from '@/lib/server-request';
import { getServerSupabase } from '@/lib/supabase-server';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;

function allow(ip: string): boolean {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  if (!boundedBody(request) || !allow(requestIp(request))) {
    return NextResponse.json({ ok: false, error: 'rate_limited', request_id: id }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body', request_id: id }, { status: 400 });
  }
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!isEmail(email)) return NextResponse.json({ ok: false, error: 'invalid_email', request_id: id }, { status: 400 });

  if (!getPublicConfig()) return NextResponse.json({ ok: false, error: 'auth_unavailable', request_id: id }, { status: 503 });
  const client = await getServerSupabase();
  if (!client) return NextResponse.json({ ok: false, error: 'auth_unavailable', request_id: id }, { status: 503 });

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: new URL(`/api/auth/callback?next=${encodeURIComponent(safeReturnTo(input.return_to))}`, request.url).toString(),
    },
  });
  if (error) {
    console.error('[auth/request-code]', { requestId: id, code: error.code ?? 'provider_error' });
    return NextResponse.json({ ok: false, error: 'auth_unavailable', request_id: id }, { status: 503 });
  }

  // The response is intentionally identical for existing and new accounts.
  return NextResponse.json({ ok: true, request_id: id });
}
