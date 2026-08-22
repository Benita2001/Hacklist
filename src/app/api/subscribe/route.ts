import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '@/config/env';
import { requestId } from '@/lib/server-request';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_body', request_id: id }, { status: 400 });
  }

  const email = body && typeof body === 'object' && typeof (body as { email?: unknown }).email === 'string'
    ? (body as { email: string }).email.trim().toLowerCase()
    : '';
  if (!email || email.length > 254 || !isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'invalid_email', request_id: id }, { status: 400 });
  }

  const config = getServerConfig();
  if (!config.brevoApiKey || !config.brevoListId) {
    console.error('[subscribe]', { requestId: id, error: 'brevo_not_configured' });
    return NextResponse.json({ success: false, error: 'server_misconfigured', request_id: id }, { status: 503 });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': config.brevoApiKey,
      },
      body: JSON.stringify({ email, listIds: [config.brevoListId], updateEnabled: true }),
      signal: AbortSignal.timeout(8_000),
    });

    if (response.status === 201) {
      void sendWelcomeEmail(config.brevoApiKey, email, id);
      return NextResponse.json({ success: true, message: 'subscribed', request_id: id });
    }
    if (response.status === 204) {
      return NextResponse.json({ success: true, message: 'already_subscribed', request_id: id });
    }

    const providerBody = await response.json().catch(() => null) as { code?: string } | null;
    if (response.status === 400 && providerBody?.code === 'duplicate_parameter') {
      return NextResponse.json({ success: true, message: 'already_subscribed', request_id: id });
    }

    console.error('[subscribe]', { requestId: id, status: response.status, code: providerBody?.code });
    return NextResponse.json({ success: false, error: 'provider_error', request_id: id }, { status: 502 });
  } catch (error) {
    console.error('[subscribe]', { requestId: id, error: error instanceof Error ? error.message : 'network_error' });
    return NextResponse.json({ success: false, error: 'provider_unavailable', request_id: id }, { status: 502 });
  }
}

async function sendWelcomeEmail(apiKey: string, email: string, id: string): Promise<void> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        to: [{ email }],
        templateId: 3,
        sender: { name: 'Beni from HackList', email: '0xbeni123@gmail.com' },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) console.error('[subscribe/welcome]', { requestId: id, status: response.status });
  } catch (error) {
    console.error('[subscribe/welcome]', { requestId: id, error: error instanceof Error ? error.message : 'network_error' });
  }
}
