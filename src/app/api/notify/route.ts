import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '@/config/env';
import { authorizeInternalRequest, requestId } from '@/lib/server-request';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  const denied = authorizeInternalRequest(request);
  if (denied) return denied;

  const config = getServerConfig();
  if (!config.telegramBotToken || !config.telegramChatId) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured', request_id: id }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body', request_id: id }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_body', request_id: id }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const text = (key: string): string | null => {
    const value = input[key];
    return typeof value === 'string' && value.trim() ? escapeHtml(value.trim()) : null;
  };
  const opportunity = text('opportunity_name') ?? text('hackathon_name') ?? 'Not provided';
  const message = [
    '<b>HackList internal notification</b>',
    '',
    `<b>Opportunity:</b> ${opportunity}`,
    `<b>Type:</b> ${text('opportunity_type') ?? 'Not provided'}`,
    `<b>Organizer:</b> ${text('organizer') ?? 'Not provided'}`,
    `<b>Apply URL:</b> ${text('apply_url') ?? 'Not provided'}`,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.telegramChatId, text: message, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error('[notify]', { requestId: id, status: response.status });
      return NextResponse.json({ ok: false, error: 'provider_error', request_id: id }, { status: 502 });
    }
  } catch (error) {
    console.error('[notify]', { requestId: id, error: error instanceof Error ? error.message : 'network_error' });
    return NextResponse.json({ ok: false, error: 'provider_unavailable', request_id: id }, { status: 502 });
  }

  return NextResponse.json({ ok: true, request_id: id });
}
