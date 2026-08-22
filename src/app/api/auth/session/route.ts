import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';

export async function GET() {
  const result = await getServerUser();
  if (!result.configured) return NextResponse.json({ ok: false, authenticated: false, error: 'auth_unavailable' }, { status: 503 });
  if (!result.user) return NextResponse.json({ ok: true, authenticated: false });
  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: { id: result.user.id, email: result.user.email ?? null },
  });
}
