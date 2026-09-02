import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicConfig } from '@/config/env';

let client: SupabaseClient | null = null;

/** Returns null during a documented local build with no Supabase credentials. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const config = getPublicConfig();
  if (!config) return null;

  client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getPublicConfig() !== null;
}

export const supabase = getSupabase();
