import { NextRequest, NextResponse } from 'next/server';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* Diagnostic GET — curl http://localhost:3000/api/subscribe */
export async function GET() {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  return NextResponse.json({
    BREVO_API_KEY_present: !!apiKey,
    BREVO_API_KEY_length:  apiKey?.length ?? 0,
    BREVO_LIST_ID:         listId ?? null,
  });
}

export async function POST(req: NextRequest) {
  /* Top-level catch — prints full stack trace to terminal */
  try {
    return await handleSubscribe(req);
  } catch (err) {
    console.error('[subscribe] UNHANDLED ERROR:', err);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}

async function handleSubscribe(req: NextRequest): Promise<NextResponse> {
  /* 1. Parse body */
  let body: { email?: unknown };
  try {
    body = await req.json() as { email?: unknown };
  } catch (err) {
    console.error('[subscribe] Failed to parse request body:', err);
    return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 });
  }

  /* 2. Validate email */
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  console.log('[subscribe] Email received:', email || '(empty)');

  if (!email || !isValidEmail(email)) {
    console.log('[subscribe] Email validation failed');
    return NextResponse.json({ success: false, error: 'invalid_email' }, { status: 400 });
  }

  /* 3. Check env vars */
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;

  console.log('[subscribe] BREVO_API_KEY present:', !!apiKey, '| length:', apiKey?.length ?? 0);
  console.log('[subscribe] BREVO_LIST_ID:', listId ?? '(undefined)');

  if (!apiKey) {
    console.error('[subscribe] BREVO_API_KEY is not set — restart the dev server after editing .env.local');
    return NextResponse.json({ success: false, error: 'server_misconfigured' }, { status: 500 });
  }
  if (!listId) {
    console.error('[subscribe] BREVO_LIST_ID is not set');
    return NextResponse.json({ success: false, error: 'server_misconfigured' }, { status: 500 });
  }

  /* 4. Call Brevo */
  const requestBody = {
    email,
    listIds:       [parseInt(listId, 10)],
    updateEnabled: true,
  };
  console.log('[subscribe] Calling Brevo with:', JSON.stringify(requestBody));

  let brevoRes: Response;
  try {
    brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'content-type': 'application/json',
        'api-key':      apiKey,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    console.error('[subscribe] Network error calling Brevo:', err);
    return NextResponse.json({ success: false, error: 'network_error' }, { status: 500 });
  }

  const rawText = await brevoRes.text();
  console.log('[subscribe] Brevo status:', brevoRes.status, '| body:', rawText);

  if (brevoRes.status === 201) {
    return NextResponse.json({ success: true, message: 'subscribed' });
  }
  if (brevoRes.status === 204) {
    return NextResponse.json({ success: true, message: 'already_subscribed' });
  }

  let data: { code?: string; message?: string } = {};
  try { data = JSON.parse(rawText) as typeof data; } catch { /* non-JSON */ }

  if (brevoRes.status === 400 && data.code === 'duplicate_parameter') {
    return NextResponse.json({ success: true, message: 'already_subscribed' });
  }

  console.error('[subscribe] Unexpected Brevo response:', brevoRes.status, data);
  return NextResponse.json({ success: false, error: 'brevo_error', detail: data }, { status: 500 });
}
