import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[announce/test] TELEGRAM_BOT_TOKEN not set');
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 });
  }

  const message = `🆕 New on HackList

<b>Test Hackathon</b>
Organizer: HackList Team
Prize Pool: $50,000
Deadline: May 30 2026
Category: AI | Online

This is a test announcement from HackList. Everything is working correctly.

Apply → https://hacklist.vercel.app

Find more opportunities at hacklist.io

Join the HackList community <a href="https://t.me/hacklistchat">here</a>`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:                  '@hacklistwithbeni',
          text:                     message,
          parse_mode:               'HTML',
          disable_web_page_preview: false,
        }),
      },
    );

    const data = await res.json() as { ok: boolean; description?: string };
    console.log('[announce/test] Telegram response:', res.status, data);

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Test announcement sent to @hacklistwithbeni' });
  } catch (err) {
    console.error('[announce/test] Fetch error:', err);
    return NextResponse.json({ ok: false, error: 'network_error' }, { status: 500 });
  }
}
