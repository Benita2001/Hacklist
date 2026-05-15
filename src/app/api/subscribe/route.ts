import { NextRequest, NextResponse } from 'next/server';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try { body = await req.json() as { email?: unknown }; }
  catch { return NextResponse.json({ success: false, error: 'something_went_wrong' }, { status: 400 }); }

  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'invalid_email' }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;

  if (!apiKey || !listId) {
    console.error('[subscribe] Missing BREVO_API_KEY or BREVO_LIST_ID');
    return NextResponse.json({ success: false, error: 'something_went_wrong' }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'content-type': 'application/json',
        'api-key':      apiKey,
      },
      body: JSON.stringify({
        email,
        listIds:       [parseInt(listId, 10)],
        updateEnabled: true,
      }),
    });

    // 201 = new contact created
    if (res.status === 201) {
      return NextResponse.json({ success: true, message: 'subscribed' });
    }

    // 204 = contact already existed, lists updated
    if (res.status === 204) {
      return NextResponse.json({ success: true, message: 'already_subscribed' });
    }

    // Brevo sometimes returns 400 with duplicate_parameter when updateEnabled is false
    if (res.status === 400) {
      const data = await res.json() as { code?: string };
      if (data.code === 'duplicate_parameter') {
        return NextResponse.json({ success: true, message: 'already_subscribed' });
      }
    }

    console.error('[subscribe] Brevo error:', res.status);
    return NextResponse.json({ success: false, error: 'something_went_wrong' }, { status: 500 });
  } catch (err) {
    console.error('[subscribe] Fetch error:', err);
    return NextResponse.json({ success: false, error: 'something_went_wrong' }, { status: 500 });
  }
}
