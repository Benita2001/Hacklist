import { getServerSupabase } from './supabase-server';

export async function getAuthenticatedRequest() {
  const client = await getServerSupabase();
  if (!client) return { client: null, user: null, configured: false } as const;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { client, user: null, configured: true } as const;
  return { client, user: data.user, configured: true } as const;
}
