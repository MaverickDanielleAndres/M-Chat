import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  ConversationRow,
  ConversationInsert,
  ConversationUpdate,
  MessageRow,
  MessageInsert,
  MessageUpdate,
  AttachmentInsert,
} from '@/types/db-helpers';
import { estimateTokens } from '@/lib/utils';

/**
 * Server-style data layer that turns DB rows into the app's local Conversation
 * shape (with messages inlined) and pushes local mutations back to Supabase.
 * Failures are swallowed and logged — callers decide whether to surface them.
 */

// ---------- conversations ----------
export async function listConversations(userId: string) {
  if (!isSupabaseConfigured) return [] as ConversationRow[];
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('pinned', { ascending: false })
    .order('last_active_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ConversationRow[];
}

export async function createConversation(insert: ConversationInsert) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('conversations')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as ConversationRow;
}

export async function updateConversation(id: string, patch: ConversationUpdate) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('conversations')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ConversationRow;
}

export async function deleteConversation(id: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('conversations').delete().eq('id', id);
  if (error) throw error;
}

export async function touchConversation(id: string) {
  if (!isSupabaseConfigured) return;
  await supabase.rpc('touch_conversation', { p_conversation_id: id });
}

// ---------- messages ----------
export async function listMessages(conversationId: string) {
  if (!isSupabaseConfigured) return [] as MessageRow[];
  const { data, error } = await supabase
    .from('messages')
    .select('*, attachments(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function insertMessage(insert: MessageInsert) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('messages')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function updateMessage(id: string, patch: MessageUpdate) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('messages')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function deleteMessage(id: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw error;
}

// ---------- attachments ----------
export async function insertAttachment(insert: AttachmentInsert) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('attachments')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadFileToStorage(
  userId: string,
  file: File,
  bucket: 'attachments' | 'avatars' = 'attachments'
): Promise<{ path: string; publicUrl: string | null }> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });
  if (error) throw error;
  let publicUrl: string | null = null;
  if (bucket === 'avatars') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    publicUrl = data.publicUrl;
  } else {
    const { data } = supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
    publicUrl = data?.signedUrl ?? null;
  }
  return { path, publicUrl };
}

// ---------- credits ----------
export interface WalletSnapshot {
  balance: number;
  daily_quota: number;
  daily_used: number;
  daily_reset_at: string;
  lifetime_granted: number;
  lifetime_spent: number;
}

export async function fetchWallet(userId: string): Promise<WalletSnapshot | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('credit_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[M-Chat] wallet fetch failed', error.message);
    return null;
  }
  return data as WalletSnapshot | null;
}

export async function ensureWallet(userId: string): Promise<WalletSnapshot | null> {
  if (!isSupabaseConfigured) return null;
  const existing = await fetchWallet(userId);
  if (existing) return existing;
  // Trigger may not have run; upsert.
  const { data, error } = await supabase
    .from('credit_wallets')
    .upsert({ user_id: userId, balance: 50, lifetime_granted: 50, daily_quota: 50 })
    .select()
    .single();
  if (error) {
    console.warn('[M-Chat] wallet ensure failed', error.message);
    return null;
  }
  return data as WalletSnapshot;
}

export interface PromptCheck {
  canSend: boolean;
  reason: 'ok' | 'quota_exhausted' | 'no_credits' | 'unlimited' | string;
  tier: string;
  dailyUsed: number;
  dailyQuota: number;
  balance: number;
}

/**
 * Authoritative DB-level check: can this user send a prompt right now?
 * Returns `{ canSend: true, ... }` when allowed, or
 * `{ canSend: false, reason: 'quota_exhausted' | 'no_credits' }` when not.
 *
 * For unauthenticated / offline mode, returns a permissive `unlimited` result
 * so the local dev experience keeps working without Supabase configured.
 */
export async function checkUserCanPrompt(userId: string | null): Promise<PromptCheck> {
  if (!userId || !isSupabaseConfigured) {
    return {
      canSend: true,
      reason: 'unlimited',
      tier: 'guest',
      dailyUsed: 0,
      dailyQuota: -1,
      balance: 0,
    };
  }
  try {
    const { data, error } = await supabase.rpc('check_user_can_prompt', { p_user_id: userId });
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      // Fail-open locally but mark as ok so the user isn't blocked on transient DB issues.
      console.warn('[M-Chat] checkUserCanPrompt failed', error?.message);
      return { canSend: true, reason: 'ok', tier: 'free', dailyUsed: 0, dailyQuota: 20, balance: 0 };
    }
    const row = data[0] as Record<string, unknown>;
    return {
      canSend: Boolean(row.can_send),
      reason: String(row.reason ?? 'ok'),
      tier: String(row.tier ?? 'free'),
      dailyUsed: Number(row.daily_used ?? 0),
      dailyQuota: Number(row.daily_quota ?? 20),
      balance: Number(row.balance ?? 0),
    };
  } catch (e) {
    return { canSend: true, reason: 'ok', tier: 'free', dailyUsed: 0, dailyQuota: 20, balance: 0 };
  }
}

/**
 * Authoritative DB-level increment: records a prompt usage transactionally
 * and returns the new daily_used / balance. Throws on quota_exhausted or
 * insufficient_credits.
 */
export async function recordPromptUsage(
  userId: string,
  amount = 1,
  metadata: Record<string, unknown> = {}
): Promise<{ newDailyUsed: number; newBalance: number }> {
  if (!isSupabaseConfigured) return { newDailyUsed: 0, newBalance: 0 };
  const { data, error } = await supabase.rpc('record_prompt_usage', {
    p_user_id: userId,
    p_amount: amount,
    p_metadata: metadata,
  });
  if (error) {
    if (/QUOTA_EXHAUSTED/i.test(error.message)) {
      throw new Error('QUOTA_EXHAUSTED');
    }
    if (/INSUFFICIENT_CREDITS/i.test(error.message)) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    throw error;
  }
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  return {
    newDailyUsed: Number(row?.new_daily_used ?? 0),
    newBalance: Number(row?.new_balance ?? 0),
  };
}

export async function spendCredits(
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string
): Promise<{ ok: true; balance: number } | { ok: false; reason: string }> {
  if (!isSupabaseConfigured) return { ok: true, balance: Infinity };
  try {
    const { data, error } = await supabase.rpc('spend_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description ?? null,
      p_reference_id: referenceId ?? null,
    });
    if (error) {
      if (error.message?.includes('INSUFFICIENT_CREDITS')) {
        return { ok: false, reason: 'INSUFFICIENT_CREDITS' };
      }
      return { ok: false, reason: error.message };
    }
    return { ok: true, balance: data as number };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'unknown' };
  }
}

// ---------- settings ----------
export async function fetchSettings(userId: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[M-Chat] settings fetch failed', error.message);
    return null;
  }
  return data;
}

/**
 * Convert app-side camelCase settings keys to DB snake_case columns.
 * The `app_settings` table uses snake_case columns; the client-side store
 * uses camelCase. Naive `upsert(patch)` would send `animationsEnabled` and
 * Postgres would create a row with that column missing — every setting would
 * silently no-op. This mapper is the single source of truth.
 */
const SETTINGS_KEY_MAP: Record<string, string> = {
  theme: 'theme',
  language: 'language',
  animationsEnabled: 'animations_enabled',
  fontSize: 'font_size',
  developerMode: 'developer_mode',
  soundEnabled: 'sound_enabled',
  enterToSend: 'enter_to_send',
  streamResponses: 'stream_responses',
  showTokenCounts: 'show_token_counts',
  density: 'density',
  accentColor: 'accent_color',
  fontFamily: 'font_family',
  customInstructions: 'custom_instructions',
  defaultModel: 'default_model',
  webSearchEnabled: 'web_search_enabled',
};

export function settingsToDbRow(
  patch: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    const col = SETTINGS_KEY_MAP[k];
    if (col) out[col] = v;
  }
  return out;
}

export async function upsertSettings(userId: string, patch: Record<string, unknown>) {
  if (!isSupabaseConfigured) return null;
  const dbPatch = settingsToDbRow(patch);
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ user_id: userId, ...dbPatch, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) {
    console.warn('[M-Chat] settings save failed', error.message);
    return null;
  }
  return data;
}

// ---------- profile ----------
export async function fetchProfile(userId: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[M-Chat] profile fetch failed', error.message);
    return null;
  }
  return data;
}

// ---------- usage ----------
export async function logUsage(entry: {
  userId: string | null;
  conversationId: string | null;
  messageId: string | null;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  creditsUsed: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
}) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('usage_logs').insert({
    user_id: entry.userId,
    conversation_id: entry.conversationId,
    message_id: entry.messageId,
    model: entry.model,
    tokens_input: entry.tokensInput,
    tokens_output: entry.tokensOutput,
    credits_used: entry.creditsUsed,
    latency_ms: entry.latencyMs,
    success: entry.success,
    error_code: entry.errorCode ?? null,
  });
  if (error) console.warn('[M-Chat] usage log failed', error.message);
}

// ---------- token helpers ----------
export function estimateMessageCost(text: string): number {
  // 1 credit per ~750 characters for chat; keeps generous headroom.
  return Math.max(1, Math.ceil(estimateTokens(text) / 250));
}