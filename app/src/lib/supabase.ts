import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[M-Chat] Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable auth and cloud features.'
  );
}

/**
 * Supabase client. We intentionally use the untyped overload so .from(),
 * .insert(), .update(), .rpc() etc. accept arbitrary objects without the
 * strict generic-constraint dance required by @supabase/supabase-js v2.
 * Strong typing lives in src/types/db-helpers.ts for app-side use.
 */
export const supabase: any = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'm-chat-auth',
    flowType: 'pkce',
  },
  global: {
    headers: { 'x-application-name': 'm-chat' },
  },
  realtime: { params: { eventsPerSecond: 5 } },
});

export type SupabaseClient = typeof supabase;

/** Convenience guard for when env vars are missing. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);