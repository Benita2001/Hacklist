import { NextResponse } from 'next/server';
import { getQueueStatus } from '@/lib/announce-queue';

export async function GET() {
  return NextResponse.json({ ok: true, ...getQueueStatus() });
}
