import { NextRequest, NextResponse } from 'next/server';
import { boundedBody, isUuid, safeReturnTo } from '@/lib/auth-request';
import { getAuthenticatedRequest } from '@/lib/private-auth';

function authError(configured: boolean, returnTo = '/') {
  return NextResponse.json(
    { ok: false, error: configured ? 'authentication_required' : 'auth_unavailable', return_to: returnTo },
    { status: configured ? 401 : 503 },
  );
}

export async function GET() {
  const { client, user, configured } = await getAuthenticatedRequest();
  if (!user || !client) return authError(configured);
  const { data, error } = await client.from('opportunity_saves').select('opportunity_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: 'saves_unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true, saves: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!boundedBody(request)) return NextResponse.json({ ok: false, error: 'request_too_large' }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 }); }
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const { client, user, configured } = await getAuthenticatedRequest();
  if (!user || !client) return authError(configured, safeReturnTo(input.return_to));
  if (!isUuid(input.opportunity_id)) return NextResponse.json({ ok: false, error: 'invalid_opportunity_id' }, { status: 400 });
  const { error } = await client.from('opportunity_saves').insert({ user_id: user.id, opportunity_id: input.opportunity_id });
  if (error && error.code !== '23505') return NextResponse.json({ ok: false, error: 'save_unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true, saved: true, opportunity_id: input.opportunity_id });
}

export async function DELETE(request: NextRequest) {
  if (!boundedBody(request)) return NextResponse.json({ ok: false, error: 'request_too_large' }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 }); }
  const opportunityId = body && typeof body === 'object' ? (body as Record<string, unknown>).opportunity_id : null;
  const { client, user, configured } = await getAuthenticatedRequest();
  if (!user || !client) return authError(configured);
  if (!isUuid(opportunityId)) return NextResponse.json({ ok: false, error: 'invalid_opportunity_id' }, { status: 400 });
  const { error } = await client.from('opportunity_saves').delete().eq('user_id', user.id).eq('opportunity_id', opportunityId);
  if (error) return NextResponse.json({ ok: false, error: 'save_unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true, saved: false, opportunity_id: opportunityId });
}
