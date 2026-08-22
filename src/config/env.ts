/**
 * Runtime configuration is deliberately kept server-only unless a value is
 * explicitly prefixed NEXT_PUBLIC_. Missing optional integrations degrade to
 * a typed, honest response instead of crashing during module evaluation.
 */

export const CONFIG_REMEDIATION =
  'Copy .env.example to .env.local, add the value, and restart the Next.js process.';

export type PublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type ServerConfig = {
  telegramBotToken?: string;
  telegramChatId?: string;
  brevoApiKey?: string;
  brevoListId?: number;
  internalApiSecret?: string;
  announceEnabled: boolean;
};

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

export function getPublicConfig(): PublicConfig | null {
  const supabaseUrl = nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return supabaseUrl && supabaseAnonKey ? { supabaseUrl, supabaseAnonKey } : null;
}

export function getMissingPublicConfig(): string[] {
  const missing: string[] = [];
  if (!nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL)) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return missing;
}

export function getServerConfig(): ServerConfig {
  const brevoListIdRaw = nonEmpty(process.env.BREVO_LIST_ID);
  const brevoListId = brevoListIdRaw ? Number.parseInt(brevoListIdRaw, 10) : undefined;

  return {
    telegramBotToken: nonEmpty(process.env.TELEGRAM_BOT_TOKEN),
    telegramChatId: nonEmpty(process.env.TELEGRAM_CHAT_ID),
    brevoApiKey: nonEmpty(process.env.BREVO_API_KEY),
    brevoListId: Number.isFinite(brevoListId) ? brevoListId : undefined,
    internalApiSecret: nonEmpty(process.env.HACKLIST_INTERNAL_API_SECRET),
    announceEnabled: parseBoolean(process.env.HACKLIST_ANNOUNCE_ENABLED, false),
  };
}

export function missingConfigMessage(names: string[]): string {
  return `Missing required configuration: ${names.join(', ')}. ${CONFIG_REMEDIATION}`;
}
