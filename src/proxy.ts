import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicConfig } from '@/config/env';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const config = getPublicConfig();
  if (!config) return response;

  const client = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        for (const { name, value, options } of values) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await client.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
