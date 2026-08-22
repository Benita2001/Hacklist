import { NextRequest, NextResponse } from 'next/server';
import { enqueueOrSend, type AnnounceBody } from '@/lib/announce-queue';
import { authorizeInternalRequest, requestId } from '@/lib/server-request';

const MAX_REQUEST_BYTES = 16_000;

function isBody(value: unknown): value is AnnounceBody {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return [body.name, body.organizer, body.category, body.format, body.description, body.apply_url]
    .every((field) => typeof field === 'string' && field.trim().length > 0 && field.length <= 2_000);
}

export async function POST(request: NextRequest) {
  const id = requestId(request);
  const denied = authorizeInternalRequest(request);
  if (denied) return denied;
  const contentLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ ok: false, error: 'request_too_large', request_id: id }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body', request_id: id }, { status: 400 });
  }

  const candidate = raw && typeof raw === 'object' && 'record' in raw
    ? (raw as { record?: unknown }).record
    : raw;
  if (!isBody(candidate)) {
    return NextResponse.json({ ok: false, error: 'invalid_announcement', request_id: id }, { status: 400 });
  }

  try {
    const result = await enqueueOrSend(candidate);
    return NextResponse.json({ ok: true, request_id: id, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'announcement_failed';
    if (code === 'announcements_disabled') {
      return NextResponse.json({ ok: false, error: code, request_id: id }, { status: 503 });
    }
    console.error('[announce]', { requestId: id, error: code });
    return NextResponse.json({ ok: false, error: 'announcement_failed', request_id: id }, { status: 502 });
  }
}
