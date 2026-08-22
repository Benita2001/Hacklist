import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function POST() {
  const client = await getServerSupabase();
  if (!client) return NextResponse.json({ ok: false, error: 'auth_unavailable' }, { status: 503 });
  const { error } = await client.auth.signOut();
  if (error) return NextResponse.json({ ok: false, error: 'signout_failed' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
