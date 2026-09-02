import { NextRequest, NextResponse } from 'next/server';
import { getQueueStatus } from '@/lib/announce-queue';
import { authorizeInternalRequest, requestId } from '@/lib/server-request';

export async function GET(request: NextRequest) {
  const id = requestId(request);
  const denied = authorizeInternalRequest(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, request_id: id, ...getQueueStatus() });
}
