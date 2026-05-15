import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/* ── Rate limiting (in-memory, per IP, 3 req / hour) ── */
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  // Prune expired entries to prevent unbounded growth
  for (const [k, v] of rateMap) { if (now > v.resetAt) rateMap.delete(k); }
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

/* ── Sanitisation ── */
function sanitize(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, '')                       // strip HTML tags
    .replace(/[<>]/g, '')                           // drop stray angle brackets
    .replace(/[\x00-\x08\x0B\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim();
}

/* ── HTML entity encoding for Telegram HTML mode ── */
function he(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Validation helpers ── */
function isEmail(s: string)    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function isHttpsUrl(s: string) { return /^https:\/\/.+/.test(s); }

const MAX: Record<string, number> = {
  hackathon_name:  200,
  organizer:       200,
  prize_pool:       50,
  description:     500,
  your_name:       100,
  your_email:      200,
  telegram_handle: 100,
  apply_url:       500,
};

const CATEGORIES = ['AI', 'Web3', 'Both'];
const FORMATS    = ['Online', 'In-Person', 'Hybrid'];
const YESNO      = ['Yes', 'No'];

export async function POST(req: NextRequest) {
  /* Rate limit */
  if (!checkRate(getIp(req))) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    );
  }

  /* Parse */
  let raw: Record<string, unknown>;
  try { raw = await req.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  /* Sanitise every field */
  const f = {
    hackathon_name:  sanitize(raw.hackathon_name),
    organizer:       sanitize(raw.organizer),
    prize_pool:      sanitize(raw.prize_pool),
    deadline:        sanitize(raw.deadline),
    apply_url:       sanitize(raw.apply_url),
    category:        sanitize(raw.category),
    format:          sanitize(raw.format),
    free_to_enter:   sanitize(raw.free_to_enter),
    is_organizer:    sanitize(raw.is_organizer),
    description:     sanitize(raw.description),
    your_name:       sanitize(raw.your_name),
    your_email:      sanitize(raw.your_email),
    telegram_handle: sanitize(raw.telegram_handle),
  };

  /* Server-side validation */
  const errors: Record<string, string> = {};

  if (!f.hackathon_name)
    errors.hackathon_name = 'Required';
  else if (f.hackathon_name.length > MAX.hackathon_name)
    errors.hackathon_name = `Max ${MAX.hackathon_name} characters`;

  if (!f.organizer)
    errors.organizer = 'Required';
  else if (f.organizer.length > MAX.organizer)
    errors.organizer = `Max ${MAX.organizer} characters`;

  if (f.prize_pool.length > MAX.prize_pool)
    errors.prize_pool = `Max ${MAX.prize_pool} characters`;

  if (!f.apply_url)
    errors.apply_url = 'Required';
  else if (!isHttpsUrl(f.apply_url))
    errors.apply_url = 'Must start with https://';
  else if (f.apply_url.length > MAX.apply_url)
    errors.apply_url = `Max ${MAX.apply_url} characters`;

  if (!CATEGORIES.includes(f.category))
    errors.category = 'Invalid category';

  if (!FORMATS.includes(f.format))
    errors.format = 'Invalid format';

  if (!YESNO.includes(f.free_to_enter))
    errors.free_to_enter = 'Required';

  if (!YESNO.includes(f.is_organizer))
    errors.is_organizer = 'Required';

  if (!f.your_name)
    errors.your_name = 'Required';
  else if (f.your_name.length > MAX.your_name)
    errors.your_name = `Max ${MAX.your_name} characters`;

  if (!f.your_email)
    errors.your_email = 'Required';
  else if (!isEmail(f.your_email))
    errors.your_email = 'Must be a valid email address';
  else if (f.your_email.length > MAX.your_email)
    errors.your_email = `Max ${MAX.your_email} characters`;

  if (f.description.length > MAX.description)
    errors.description = `Max ${MAX.description} characters`;

  if (f.telegram_handle.length > MAX.telegram_handle)
    errors.telegram_handle = `Max ${MAX.telegram_handle} characters`;

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  /* Persist to Supabase */
  try {
    const { error } = await supabase.from('listing_requests').insert([{
      hackathon_name:  f.hackathon_name,
      organizer:       f.organizer,
      prize_pool:      f.prize_pool  || null,
      deadline:        f.deadline    || null,
      apply_url:       f.apply_url,
      category:        f.category,
      format:          f.format,
      free_to_enter:   f.free_to_enter  === 'Yes',
      is_organizer:    f.is_organizer   === 'Yes',
      description:     f.description   || null,
      your_name:       f.your_name,
      your_email:      f.your_email,
      telegram_handle: f.telegram_handle || null,
    }]);
    if (error) throw error;
  } catch (err) {
    console.error('[submit] Supabase error:', err);
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }

  /* Telegram — non-blocking, HTML parse mode with entity-encoded user content */
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const text = [
      '<b>New HackList Submission</b>',
      '',
      `<b>Hackathon:</b> ${he(f.hackathon_name)}`,
      `<b>Organizer:</b> ${he(f.organizer)}`,
      `<b>Prize Pool:</b> ${he(f.prize_pool  || 'Not provided')}`,
      `<b>Deadline:</b> ${he(f.deadline     || 'Not provided')}`,
      `<b>Apply URL:</b> ${he(f.apply_url)}`,
      `<b>Category:</b> ${he(f.category)}`,
      `<b>Format:</b> ${he(f.format)}`,
      `<b>Free to Enter:</b> ${he(f.free_to_enter)}`,
      `<b>Is Organizer:</b> ${he(f.is_organizer)}`,
      '',
      `<b>Description:</b> ${he(f.description || 'Not provided')}`,
      '',
      `<b>Submitted by:</b> ${he(f.your_name)}`,
      `<b>Email:</b> ${he(f.your_email)}`,
      `<b>Telegram:</b> ${he(f.telegram_handle || 'Not provided')}`,
    ].join('\n');

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
