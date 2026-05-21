import { NextRequest, NextResponse } from 'next/server';

function he(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface AnnounceBody {
  name:          string;
  organizer:     string;
  prize_pool:    string;
  deadline?:     string | null;
  deadline_text?: string | null;
  category:      string;
  format:        string;
  description:   string;
  apply_url:     string;
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[announce] TELEGRAM_BOT_TOKEN not set');
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 });
  }

  let body: AnnounceBody;
  try {
    body = await req.json() as AnnounceBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const { name, organizer, prize_pool, deadline, deadline_text, category, format, description, apply_url } = body;

  if (!name || !organizer || !apply_url) {
    return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 });
  }

  const deadlineDisplay = deadline_text || deadline || 'TBD';

  const message = `🆕 New on HackList

<b>${he(name)}</b>
Organizer: ${he(organizer)}
Prize Pool: ${he(prize_pool || 'Undisclosed')}
Deadline: ${he(deadlineDisplay)}
Category: ${he(category)} | ${he(format)}

${he(description || '')}

Apply → ${he(apply_url)}

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
    console.log('[announce] Telegram response:', res.status, data);

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[announce] Fetch error:', err);
    return NextResponse.json({ ok: false, error: 'network_error' }, { status: 500 });
  }
}
// webhook enabled
// v3
// analytics deploy
