import { NextRequest, NextResponse } from 'next/server';
import { boundedBody, safeReturnTo } from '@/lib/auth-request';
import { getAuthenticatedRequest } from '@/lib/private-auth';
import { parseAlertPreferences } from '@/domain/notifications/alert-policy';

function authError(configured: boolean, returnTo = '/') {
  return NextResponse.json(
    { ok: false, error: configured ? 'authentication_required' : 'auth_unavailable', return_to: returnTo },
    { status: configured ? 401 : 503 },
  );
}

export async function GET() {
  const { client, user, configured } = await getAuthenticatedRequest();
  if (!user || !client) return authError(configured);
  const { data, error } = await client.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ ok: false, error: 'alerts_unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true, alerts: data ?? [] });
}

export async function PUT(request: NextRequest) {
  if (!boundedBody(request)) return NextResponse.json({ ok: false, error: 'request_too_large' }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 }); }
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const { client, user, configured } = await getAuthenticatedRequest();
  if (!user || !client) return authError(configured, safeReturnTo(input.return_to));

  const preferences = parseAlertPreferences(input);
  if (!preferences.ok) {
    return NextResponse.json({ ok: false, error: 'invalid_alert_preferences', fields: preferences.errors }, { status: 400 });
  }
  const { data, error } = await client.from('subscriptions').upsert({
    user_id: user.id,
    channel: 'email',
    verified_destination: user.email ?? null,
    opportunity_types: preferences.value.opportunityTypes,
    topics: [],
    geography: [],
    remote_preference: 'any',
    normal_alerts: preferences.value.normalAlerts,
    provisional_alerts: preferences.value.provisionalAlerts,
    cadence: preferences.value.cadence,
    quiet_hours: preferences.value.quietHours ?? {},
    verified_at: user.email_confirmed_at ?? new Date().toISOString(),
  }, { onConflict: 'user_id,channel' }).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: 'alerts_unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true, alert: data });
}

export async function DELETE() {
  const { client, user, configured } = await getAuthenticatedRequest();
  if (!user || !client) return authError(configured);
  const { error } = await client.from('subscriptions').delete().eq('user_id', user.id).eq('channel', 'email');
  if (error) return NextResponse.json({ ok: false, error: 'alerts_unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
