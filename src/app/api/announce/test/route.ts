import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '@/config/env';
import { authorizeInternalRequest, requestId } from '@/lib/server-request';

export async function POST(request: NextRequest) {
  const id = requestId(request);
  const denied = authorizeInternalRequest(request);
  if (denied) return denied;

  const config = getServerConfig();
  if (!config.telegramBotToken || !config.telegramChatId) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured', request_id: id }, { status: 503 });
  }

  const message = [
    '<b>HackList operational test</b>',
    '',
    'This is a test announcement from HackList.',
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.telegramChatId, text: message, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(8_000),
    });
    const data = await response.json() as { ok?: boolean };
    if (!response.ok || !data.ok) {
      console.error('[announce/test]', { requestId: id, status: response.status });
      return NextResponse.json({ ok: false, error: 'provider_error', request_id: id }, { status: 502 });
    }
    return NextResponse.json({ ok: true, request_id: id }, { status: 200 });
  } catch (error) {
    console.error('[announce/test]', { requestId: id, error: error instanceof Error ? error.message : 'network_error' });
    return NextResponse.json({ ok: false, error: 'provider_unavailable', request_id: id }, { status: 502 });
  }
}
