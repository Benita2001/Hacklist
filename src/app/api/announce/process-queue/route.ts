import { NextRequest, NextResponse } from 'next/server';
import { processQueue } from '@/lib/announce-queue';
import { authorizeInternalRequest, requestId } from '@/lib/server-request';

export async function POST(request: NextRequest) {
  const id = requestId(request);
  const denied = authorizeInternalRequest(request);
  if (denied) return denied;

  try {
    const result = await processQueue();
    return NextResponse.json({ ok: true, request_id: id, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'queue_failed';
    if (code === 'announcements_disabled') {
      return NextResponse.json({ ok: false, error: code, request_id: id }, { status: 503 });
    }
    console.error('[process-queue]', { requestId: id, error: code });
    return NextResponse.json({ ok: false, error: 'queue_failed', request_id: id }, { status: 502 });
  }
}
