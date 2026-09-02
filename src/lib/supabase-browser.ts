import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getPublicConfig } from '@/config/env';

let client: SupabaseClient<Database> | null = null;

/** Browser auth client. Public catalogue reads continue using the safe client in supabase.ts. */
export function getBrowserSupabase(): SupabaseClient<Database> | null {
  if (client) return client;
  const config = getPublicConfig();
  if (!config) return null;
  client = createBrowserClient<Database>(config.supabaseUrl, config.supabaseAnonKey);
  return client;
}
