import { NextResponse } from 'next/server';
import { processQueue } from '@/lib/announce-queue';

export async function GET() {
  try {
    const result = await processQueue();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[process-queue] Error:', err);
    const message = err instanceof Error ? err.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
