import { NextResponse } from 'next/server';

function he(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMessage(data: Record<string, string>): string {
  const s = (k: string) => he(data[k] || 'Not provided');
  return [
    '<b>New HackList Submission</b>',
    '',
    `<b>Hackathon:</b> ${s('hackathon_name')}`,
    `<b>Organizer:</b> ${s('organizer')}`,
    `<b>Prize Pool:</b> ${s('prize_pool')}`,
    `<b>Deadline:</b> ${s('deadline')}`,
    `<b>Apply URL:</b> ${s('apply_url')}`,
    `<b>Category:</b> ${s('category')}`,
    `<b>Format:</b> ${s('format')}`,
    `<b>Free to Enter:</b> ${s('free_to_enter')}`,
    `<b>Is Organizer:</b> ${s('is_organizer')}`,
    '',
    `<b>Description:</b> ${s('description')}`,
    '',
    `<b>Submitted by:</b> ${s('your_name')}`,
    `<b>Email:</b> ${s('your_email')}`,
    `<b>Telegram:</b> ${s('telegram_handle')}`,
  ].join('\n');
}

export async function POST(request: Request) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json() as Record<string, string>;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       buildMessage(body),
        parse_mode: 'HTML',
      }),
    });
  } catch {
    // Non-blocking — silently ignore
  }

  return NextResponse.json({ ok: true });
}
