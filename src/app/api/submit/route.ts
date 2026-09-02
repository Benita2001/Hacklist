import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '@/config/env';
import { parseSubmission } from '@/domain/opportunities/schemas';
import { toListingRequestRow } from '@/domain/opportunities/legacy-mapper';
import { getSupabase } from '@/lib/supabase';
import { requestId } from '@/lib/server-request';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUEST_BYTES = 32_000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  for (const [key, value] of rateMap) {
    if (now > value.resetAt) rateMap.delete(key);
  }
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count += 1;
  return true;
}

function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonError(error: string, status: number, id: string, errors?: Record<string, string>) {
  return NextResponse.json({ ok: false, error, request_id: id, ...(errors ? { errors } : {}) }, { status });
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  if (!checkRate(getIp(request))) return jsonError('rate_limited', 429, id);

  const contentLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_REQUEST_BYTES) return jsonError('request_too_large', 413, id);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('invalid_body', 400, id);
  }

  const parsed = parseSubmission(raw);
  if (!parsed.success) return jsonError('validation_failed', 400, id, parsed.errors);

  const supabase = getSupabase();
  if (!supabase) return jsonError('server_misconfigured', 503, id);

  try {
    const { error } = await supabase.from('listing_requests').insert([toListingRequestRow(parsed.data)]);
    if (error) {
      console.error('[submit]', { requestId: id, code: error.code, message: error.message });
      return jsonError('submission_unavailable', 503, id);
    }
  } catch (error) {
    console.error('[submit]', { requestId: id, error: error instanceof Error ? error.message : 'unknown_error' });
    return jsonError('submission_unavailable', 503, id);
  }

  const config = getServerConfig();
  if (config.telegramBotToken && config.telegramChatId) {
    const text = [
      '<b>New HackList Submission</b>',
      '',
      `<b>Opportunity:</b> ${escapeHtml(parsed.data.opportunityName)}`,
      `<b>Type:</b> ${escapeHtml(parsed.data.opportunityType)}`,
      `<b>Organizer:</b> ${escapeHtml(parsed.data.organizer)}`,
      `<b>Apply URL:</b> ${escapeHtml(parsed.data.applyUrl)}`,
      `<b>Category:</b> ${escapeHtml(parsed.data.category)}`,
      `<b>Submitted by:</b> ${escapeHtml(parsed.data.yourName)}`,
      `<b>Email:</b> ${escapeHtml(parsed.data.yourEmail)}`,
    ].join('\n');

    void fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.telegramChatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(8_000),
    }).catch((error: unknown) => {
      console.error('[submit] notification failed', { requestId: id, error: error instanceof Error ? error.message : 'unknown_error' });
    });
  }

  return NextResponse.json({ ok: true, request_id: id }, { status: 200 });
}
