import { NextRequest, NextResponse } from 'next/server';
import { safeReturnTo } from '@/lib/auth-request';
import { getServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const redirectTo = safeReturnTo(request.nextUrl.searchParams.get('next'));
  const client = await getServerSupabase();
  if (!code || !client) return NextResponse.redirect(new URL(`/login?error=unavailable&next=${encodeURIComponent(redirectTo)}`, request.url));

  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=verification_failed&next=${encodeURIComponent(redirectTo)}`, request.url));
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
