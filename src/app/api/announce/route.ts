import { NextRequest, NextResponse } from 'next/server';
import { enqueueOrSend, type AnnounceBody } from '@/lib/announce-queue';

export async function POST(req: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('[announce] TELEGRAM_BOT_TOKEN not set');
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  console.log('[announce] raw payload:', JSON.stringify(raw));

  const payload = raw as Record<string, unknown>;
  const body = (
    payload.record && typeof payload.record === 'object'
      ? payload.record
      : payload
  ) as AnnounceBody;

  if (!body.name || !body.organizer || !body.apply_url) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 });
  }

  try {
    const result = await enqueueOrSend(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[announce] Error:', err);
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
// webhook enabled
// v3
// analytics deploy
// analytics v2
