import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './database.types';
import { getPublicConfig } from '@/config/env';

export async function getServerSupabase(): Promise<SupabaseClient<Database> | null> {
  const config = getPublicConfig();
  if (!config) return null;
  const cookieStore = await cookies();

  return createServerClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          for (const { name, value, options } of values) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot always write cookies. Middleware refreshes
          // sessions on navigations; API routes can still set them here.
        }
      },
    },
  });
}

export async function getServerUser() {
  const client = await getServerSupabase();
  if (!client) return { user: null, configured: false };
  const { data, error } = await client.auth.getUser();
  if (error) return { user: null, configured: true };
  return { user: data.user, configured: true };
}
