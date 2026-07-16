import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Conversation,
  ChatMessage,
  AppSettings,
  Toast,
  AIStatus,
  ThemeMode,
} from '@/types';
import {
  FREE_PROMPT_LIMIT,
} from '@/types';
import {
  createAIProvider,
  parseSSEStream,
  isValidGeminiKey,
  sendMessageWithFallback,
} from '@/services/ai';
import {
  listConversations,
  createConversation as dbCreateConversation,
  updateConversation as dbUpdateConversation,
  deleteConversation as dbDeleteConversation,
  listMessages,
  insertMessage as dbInsertMessage,
  updateMessage as dbUpdateMessage,
  deleteMessage as dbDeleteMessage,
  touchConversation,
  ensureWallet,
  fetchWallet,
  checkUserCanPrompt,
  recordPromptUsage,
  fetchSettings,
  upsertSettings,
  fetchProfile,
  uploadFileToStorage,
  insertAttachment,
  logUsage,
} from '@/lib/conversations';
import { extractText } from '@/lib/extract';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SettingsRow, ProfileRow } from '@/types/db-helpers';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
/**
 * Generates a real RFC4122 v4 UUID. All Supabase tables (conversations,
 * messages, attachments, etc.) use `UUID PRIMARY KEY` columns, so client-side
 * IDs MUST be valid UUIDs — otherwise the database rejects the row with
 * `invalid input syntax for type uuid` (Postgres error `22P02`).
 *
 * `crypto.randomUUID` is available in modern browsers and Node ≥ 19. We fall
 * back to a manually-constructed v4 for the rare runtime that lacks it.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122 v4 fallback (no crypto.randomUUID): 32 random hex chars + version
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  animationsEnabled: true,
  fontSize: 'medium',
  developerMode: false,
  soundEnabled: true,
  enterToSend: true,
  streamResponses: true,
  showTokenCounts: false,
  density: 'comfortable',
  accentColor: '#6366f1',
  fontFamily: 'sans',
  customInstructions: '',
  defaultModel: 'gemini-2.0-flash',
};

// ---------------------------------------------------------------------------
// store state
// ---------------------------------------------------------------------------
interface StoreState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // UI State
  sidebarOpen: boolean;
  settingsOpen: boolean;
  limitModalOpen: boolean;
  developerMode: boolean;
  searchQuery: string;

  // AI State
  aiStatus: AIStatus;
  isGenerating: boolean;

  // Prompt / credit tracking
  promptCount: number;
  wallet: { balance: number; daily_quota: number; daily_used: number; daily_reset_at: string };

  // Auth
  userId: string | null;
  isAuthed: boolean;
  profile: ProfileRow | null;

  // Settings
  settings: AppSettings;

  // Toasts
  toasts: Toast[];

  // Boot / sync
  isSyncing: boolean;
  hasBootstrapped: boolean;
  realtimeChannel: any | null;

  // Actions
  bootstrap: () => Promise<void>;


  createConversation: () => Promise<string>;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  pinConversation: (id: string) => Promise<void>;
  duplicateConversation: (id: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  syncConversations: () => Promise<void>;

  sendMessage: (
    content: string,
    attachments?: File[]
  ) => Promise<void>;
  stopGeneration: () => void;
  likeMessage: (convId: string, msgId: string, liked: boolean) => Promise<void>;
  deleteMessage: (convId: string, msgId: string) => Promise<void>;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSettings: () => void;
  toggleLimitModal: () => void;
  setSearchQuery: (query: string) => void;

  setTheme: (theme: ThemeMode) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  exportData: () => string;
  importData: (data: string) => boolean;
  resetEverything: () => Promise<void>;

  setUser: (userId: string | null, profile: ProfileRow | null) => Promise<void>;
  refreshWallet: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// store
// ---------------------------------------------------------------------------
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      sidebarOpen: true,
      settingsOpen: false,
      limitModalOpen: false,
      developerMode: false,
      searchQuery: '',
      aiStatus: 'online',
      isGenerating: false,
      promptCount: 0,
      wallet: {
        balance: FREE_PROMPT_LIMIT,
        daily_quota: FREE_PROMPT_LIMIT,
        daily_used: 0,
        daily_reset_at: new Date(Date.now() + 86_400_000).toISOString(),
      },
      userId: null,
      isAuthed: false,
      profile: null,
      settings: { ...defaultSettings },
      toasts: [],
      isSyncing: false,
      hasBootstrapped: false,
      realtimeChannel: null,

      // -------- bootstrap --------
      bootstrap: async () => {
        if (get().hasBootstrapped) return;
        set({ isSyncing: true });
        try {
          if (isSupabaseConfigured) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.user) {
              const profile = (await fetchProfile(session.user.id)) as ProfileRow | null;
              await get().setUser(session.user.id, profile);
            }
          }
        } catch (err) {
          console.warn('[M-Chat] bootstrap failed', err);
        } finally {
          set({ hasBootstrapped: true, isSyncing: false });
        }
      },

      setUser: async (userId, profile) => {
        const prevUserId = get().userId;
        if (userId === prevUserId) return;

        // Cleanup old realtime channel
        const currentChannel = get().realtimeChannel;
        if (currentChannel) {
          supabase.removeChannel(currentChannel);
        }

        set({ userId, profile, isAuthed: !!userId, realtimeChannel: null });

        if (userId) {
          get().refreshWallet();
          
          // Set up realtime subscription for credit_wallets
          if (isSupabaseConfigured) {
            const channel = supabase
              .channel(`public:credit_wallets:user_id=eq.${userId}`)
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'credit_wallets',
                  filter: `user_id=eq.${userId}`,
                },
                (payload: any) => {
                  const newData = payload.new as any;
                  if (newData) {
                    set(() => ({
                      wallet: {
                        balance: newData.balance,
                        daily_quota: newData.daily_quota,
                        daily_used: newData.daily_used,
                        daily_reset_at: newData.daily_reset_at,
                      },
                    }));
                    
                    // Show a toast if balance increased (e.g. granted credits)
                    const oldWallet = get().wallet;
                    if (newData.balance > oldWallet.balance) {
                      get().addToast({ type: 'success', message: `You received ${newData.balance - oldWallet.balance} credits!` });
                    }
                  }
                }
              )
              .subscribe();
            
            set({ realtimeChannel: channel });
          }
        }
        
        try {
          if (userId) {
            await ensureWallet(userId);
            const remoteSettings = (await fetchSettings(userId)) as SettingsRow | null;
            if (remoteSettings) {
              const merged = mergeRemoteSettings(remoteSettings, get().settings);
              set({ settings: merged });
            }
          }
          await get().syncConversations();
        } catch (err) {
          console.warn('[M-Chat] setUser failed', err);
        }
      },

      refreshWallet: async () => {
        const userId = get().userId;
        if (!userId) return;
        const wallet = await fetchWallet(userId);
        if (wallet) {
          set({
            wallet: {
              balance: wallet.balance,
              daily_quota: wallet.daily_quota,
              daily_used: wallet.daily_used,
              daily_reset_at: wallet.daily_reset_at,
            },
          });
        }
      },

      // -------- conversations --------
      syncConversations: async () => {
        const userId = get().userId;
        if (!userId || !isSupabaseConfigured) return;
        set({ isSyncing: true });
        try {
          const rows = await listConversations(userId);
          const convs: Conversation[] = await Promise.all(
            rows.map(async (r) => {
              const messages = await listMessages(r.id);
              return {
                id: r.id,
                title: r.title,
                pinned: r.pinned,
                model: r.model,
                userId: r.user_id,
                synced: true,
                createdAt: new Date(r.created_at).getTime(),
                updatedAt: new Date(r.updated_at).getTime(),
                messages: messages.map(rowToMessage),
                messageCount: r.message_count ?? messages.length,
                system_prompt: r.system_prompt ?? undefined,
              };
            })
          );
          set((s) => ({
            conversations: mergeConversations(s.conversations, convs),
            activeConversationId:
              s.activeConversationId && convs.find((c) => c.id === s.activeConversationId)
                ? s.activeConversationId
                : convs[0]?.id ?? null,
          }));
        } catch (err) {
          console.warn('[M-Chat] sync failed', err);
        } finally {
          set({ isSyncing: false });
        }
      },

      createConversation: async () => {
        const now = Date.now();
        const userId = get().userId;

        // Authed users: create the DB row first so the ID is a real UUID and
        // the conversation survives a reload. The local entry takes the
        // server-issued UUID so subsequent message inserts target the same row.
        if (userId && isSupabaseConfigured) {
          try {
            const row = await dbCreateConversation({
              user_id: userId,
              title: 'New Conversation',
              model: get().settings.defaultModel ?? 'gemini-2.0-flash',
            });
            if (row?.id) {
              const conv: Conversation = {
                id: row.id,
                title: row.title ?? 'New Conversation',
                messages: [],
                createdAt: new Date(row.created_at).getTime(),
                updatedAt: new Date(row.updated_at).getTime(),
                pinned: row.pinned ?? false,
                model: row.model,
                userId: row.user_id,
                system_prompt: row.system_prompt ?? undefined,
                messageCount: row.message_count ?? 0,
                synced: true,
              };
              set((s) => ({
                conversations: [conv, ...s.conversations.filter((c) => c.id !== conv.id)],
                activeConversationId: conv.id,
              }));
              return conv.id;
            }
          } catch (err) {
            console.warn('[M-Chat] createConversation (DB) failed — falling back to local', err);
          }
        }

        // Guest / offline: generate a real UUID locally so any later sync
        // (once the user signs in) still targets a UUID column.
        const id = generateId();
        const local: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: now,
          updatedAt: now,
          synced: false,
        };
        set((s) => ({
          conversations: [local, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      deleteConversation: async (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        // Optimistic local removal
        set((s) => {
          const remaining = s.conversations.filter((c) => c.id !== id);
          const nextActive =
            s.activeConversationId === id
              ? remaining[0]?.id ?? null
              : s.activeConversationId;
          return {
            conversations: remaining,
            activeConversationId: nextActive,
          };
        });
        // Only hit the DB if this conversation actually persisted (real UUID
        // assigned by Postgres). Local-only IDs are safe to drop without a
        // server round-trip.
        if (isSupabaseConfigured && get().userId && conv?.synced) {
          try {
            await dbDeleteConversation(id);
          } catch (err) {
            console.warn('[M-Chat] deleteConversation sync failed', err);
          }
        }
      },

      renameConversation: async (id, title) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }));
        if (isSupabaseConfigured && get().userId) {
          try {
            await dbUpdateConversation(id, { title });
          } catch (err) {
            console.warn('[M-Chat] renameConversation sync failed', err);
          }
        }
      },

      updateConversation: async (id: string, updates: Partial<Conversation>) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
        if (isSupabaseConfigured && get().userId) {
          try {
            await dbUpdateConversation(id, updates);
          } catch (err) {
            console.warn('[M-Chat] updateConversation sync failed', err);
          }
        }
      },

      pinConversation: async (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;
        const nextPinned = !conv.pinned;
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, pinned: nextPinned } : c
          ),
        }));
        if (isSupabaseConfigured && get().userId) {
          try {
            await dbUpdateConversation(id, { pinned: nextPinned });
          } catch (err) {
            console.warn('[M-Chat] pinConversation sync failed', err);
          }
        }
      },

      duplicateConversation: async (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;
        const newId = generateId();
        const now = Date.now();
        const copy: Conversation = {
          ...conv,
          id: newId,
          title: `${conv.title} (Copy)`,
          createdAt: now,
          updatedAt: now,
          messages: conv.messages.map((m) => ({ ...m })),
          synced: false,
        };
        set((s) => ({
          conversations: [copy, ...s.conversations],
          activeConversationId: newId,
        }));
        if (isSupabaseConfigured && get().userId) {
          try {
            const row = await dbCreateConversation({
              user_id: get().userId!,
              title: copy.title,
              model: conv.model ?? 'gemini-2.0-flash',
            });
            if (row) {
              for (const m of copy.messages) {
                await dbInsertMessage({
                  conversation_id: row.id,
                  role: m.role as any,
                  content: m.content,
                  status: 'complete' as any,
                });
              }
            }
          } catch (err) {
            console.warn('[M-Chat] duplicate sync failed', err);
          }
        }
      },

      clearAllConversations: async () => {
        const userId = get().userId;
        set({ conversations: [], activeConversationId: null });
        if (userId && isSupabaseConfigured) {
          try {
            const { error } = await supabase
              .from('conversations')
              .delete()
              .eq('user_id', userId);
            if (error) throw error;
          } catch (err) {
            console.warn('[M-Chat] clearAll failed', err);
          }
        }
      },

      // -------- messages --------
      sendMessage: async (content, attachments) => {
        const state = get();
        const userId = state.userId;

        // ── DB-level quota gate ────────────────────────────────────────
        // The database is the single source of truth: ask it whether this
        // user may send a prompt right now. Only open the limit modal when
        // the DB explicitly says `quota_exhausted` — never based on local
        // guesses. When offline or unauthenticated, fall through.
        const check = await checkUserCanPrompt(userId);
        // Sync local wallet with the authoritative state returned by the DB
        if (userId && isSupabaseConfigured) {
          set({
            wallet: {
              balance: check.balance,
              daily_quota: check.dailyQuota,
              daily_used: check.dailyUsed,
              daily_reset_at: state.wallet.daily_reset_at,
            },
          });
        }

        if (!check.canSend) {
          // Only the database-declared quota_exhausted opens the modal.
          // `no_credits` / other reasons are surfaced as toasts without
          // hijacking the whole screen.
          if (check.reason === 'quota_exhausted') {
            set({ limitModalOpen: true });
          } else {
            get().addToast({
              type: 'warning',
              message:
                check.reason === 'no_credits'
                  ? 'No credits available — upgrade to keep chatting.'
                  : 'Could not send message. Please try again.',
            });
          }
          return;
        }

        let convId = state.activeConversationId;
        if (!convId) {
          convId = await get().createConversation();
        }
        const conversation = get().conversations.find((c) => c.id === convId);
        if (!conversation) return;

        // optimistic local user message — attach FileAttachment metadata so the
        // uploaded files render in the chat bubble without a round-trip.
        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: Date.now(),
          status: 'complete',
          attachments: attachments?.length
            ? attachments.map((f) => ({
                id: generateId(),
                name: f.name,
                type: f.type,
                size: f.size,
                url: URL.createObjectURL(f),
              }))
            : undefined,
        };
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'streaming',
        };

        // Optimistic local UI bump; the authoritative write happens via
        // record_prompt_usage below and we re-sync from its result.
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, userMessage],
                  updatedAt: Date.now(),
                }
              : c
          ),
          aiStatus: 'thinking',
          promptCount: s.promptCount + 1,
          wallet: {
            ...s.wallet,
            daily_used: s.wallet.daily_used + 1,
            // NOTE: balance is intentionally NOT decremented for free-tier
            // daily prompts — see check_user_can_prompt / record_prompt_usage.
            // Balance is only consulted by paid tiers; the schema decides.
          },
        }));

        await new Promise((r) => setTimeout(r, 350));

        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c
          ),
          aiStatus: 'generating',
          isGenerating: true,
        }));

        // ---------- persist user message + attachments ----------
        let dbConversationId: string | null = conversation.synced ? conversation.id : null;

        if (userId && isSupabaseConfigured) {
          try {
            if (!dbConversationId) {
              const row = await dbCreateConversation({
                user_id: userId,
                title: conversation.title,
                model: conversation.model ?? 'gemini-2.0-flash',
              });
              if (row) {
                dbConversationId = row.id;
                set((s) => ({
                  conversations: s.conversations.map((c) =>
                    c.id === convId
                      ? { ...c, id: row.id, synced: true, userId }
                      : c
                  ),
                  activeConversationId:
                    s.activeConversationId === convId ? row.id : s.activeConversationId,
                }));
                convId = row.id;
              }
            }
            if (dbConversationId) {
              const userMsgRow = await dbInsertMessage({
                conversation_id: dbConversationId,
                role: 'user' as any,
                content,
                status: 'complete' as any,
              });
              // Bump DB-authoritative message count locally so the header
              // reflects truth without a full re-sync round-trip.
              set((s) => ({
                conversations: s.conversations.map((c) =>
                  c.id === convId
                    ? { ...c, messageCount: (c.messageCount ?? 0) + 1 }
                    : c
                ),
              }));
              if (attachments?.length && userMsgRow?.id) {
                for (const file of attachments) {
                  try {
                    const { path, publicUrl } = await uploadFileToStorage(userId, file);
                    await insertAttachment({
                      message_id: userMsgRow.id,
                      user_id: userId,
                      kind: guessAttachmentKind(file.type),
                      file_name: file.name,
                      mime_type: file.type,
                      size_bytes: file.size,
                      storage_path: path,
                      public_url: publicUrl,
                    });
                  } catch (err) {
                    console.warn('[M-Chat] attachment upload failed', err);
                  }
                }
              }
            }
          } catch (err) {
            console.warn('[M-Chat] sendMessage sync failed', err);
          }
        }

        // ---------- record prompt usage atomically (DB-authoritative) ----------
        // We already pre-checked with check_user_can_prompt; this call
        // increments daily_used and (for paid tiers) decrements balance.
        // If the DB raises QUOTA_EXHAUSTED here (e.g. another tab used a
        // prompt in the meantime) we surface it and abort cleanly.
        if (userId && isSupabaseConfigured) {
          try {
            const after = await recordPromptUsage(userId, 1, {
              source: 'chat',
              conversation_id: dbConversationId,
            });
            set({
              wallet: {
                ...get().wallet,
                daily_used: after.newDailyUsed,
                balance: after.newBalance,
              },
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('QUOTA_EXHAUSTED')) {
              get().addToast({
                type: 'warning',
                message: 'Daily quota reached. Upgrade to keep chatting.',
              });
              set({ limitModalOpen: true, isGenerating: false, aiStatus: 'online' });
              return;
            }
            if (msg.includes('INSUFFICIENT_CREDITS')) {
              get().addToast({
                type: 'warning',
                message: 'No credits remaining. Upgrade to Pro for unlimited prompts.',
              });
              set({ limitModalOpen: true, isGenerating: false, aiStatus: 'online' });
              return;
            }
            // Unexpected error — log but don't block the user
            console.warn('[M-Chat] recordPromptUsage failed', err);
          }
        }

        // ---------- generate AI stream (with automatic fallback to demo mode) ----------
        const messagesForAPI = [...conversation.messages, userMessage].map((m) => ({
          ...m,
          status: 'complete' as const,
        }));

        // Pre-extract text from text-based attachments and inline it into the
        // user's prompt so the AI can reason over document content even when
        // Gemini rejects large PDFs. Inline-able files (images, small PDFs)
        // are still sent as inlineData by the provider.
        let aiPrompt = content;
        if (attachments?.length) {
          const excerpts: string[] = [];
          for (const file of attachments) {
            const text = await extractText(file);
            if (text && text.length > 0) {
              const clipped = text.length > 60_000 ? text.slice(0, 60_000) + '\n\n[…truncated…]' : text;
              excerpts.push(`\n\n--- ${file.name} ---\n${clipped}`);
            }
          }
          if (excerpts.length) aiPrompt = `${content}${excerpts.join('')}`;
        }

        let fullContent = '';
        const startTime = Date.now();
        let tokensIn = 0;
        let tokensOut = 0;
        let fallbackReason: string | undefined;

        try {
          const { stream, usedFallback, fallbackReason: reason } =
            await sendMessageWithFallback(
              messagesForAPI,
              attachments ?? [],
              aiPrompt,
              get().settings.customInstructions,
              // Persona prompt wins over the default system instruction.
              conversation.system_prompt || undefined
            );

          fallbackReason = reason;

          // Show a non-blocking info toast if we used the fallback so the
          // user knows the response is informational, not the real AI.
          if (usedFallback && reason) {
            get().addToast({ type: 'info', message: reason, duration: 6000 });
          }

          // Batch stream updates with rAF so we don't trigger a React render on every
          // SSE chunk. Without this, a fast stream produces 60+ renders/sec and
          // tanks typing/scroll responsiveness. We flush the latest content on
          // every animation frame (~60Hz max) and also every 32ms as a safety
          // net for non-active-tab cases where rAF can be throttled.
          let pendingContent = '';
          let rafScheduled = false;
          let lastFlush = 0;
          const flush = () => {
            rafScheduled = false;
            const toFlush = pendingContent;
            pendingContent = '';
            lastFlush = Date.now();
            if (!toFlush) return;
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessage.id
                          ? { ...m, content: toFlush }
                          : m
                      ),
                    }
                  : c
              ),
            }));
          };
          const schedule = () => {
            if (rafScheduled) return;
            rafScheduled = true;
            const elapsed = Date.now() - lastFlush;
            if (elapsed >= 32) {
              // Long enough since last flush; flush immediately so the UI
              // updates even when rAF is throttled in background tabs.
              flush();
            } else {
              requestAnimationFrame(flush);
            }
          };

          for await (const chunk of parseSSEStream(stream)) {
            if (chunk.done) break;
            fullContent += chunk.content;
            tokensOut += Math.ceil((chunk.content?.length ?? 0) / 4);
            pendingContent = fullContent;
            schedule();
          }
          // Final flush so the last partial chunk is rendered.
          flush();

          const latency = Date.now() - startTime;
          tokensIn = Math.ceil(
            aiPrompt.length / 4
          );

          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: fullContent, status: 'complete' }
                        : m
                    ),
                    updatedAt: Date.now(),
                  }
                : c
            ),
            aiStatus: 'online',
            isGenerating: false,
          }));

          // persist assistant message
          if (userId && isSupabaseConfigured && dbConversationId) {
            try {
              await dbInsertMessage({
                conversation_id: dbConversationId,
                role: 'assistant' as any,
                content: fullContent,
                status: 'complete' as any,
                tokens_input: tokensIn,
                tokens_output: tokensOut,
                latency_ms: latency,
                model: usedFallback ? 'demo-fallback' : 'gemini-2.0-flash',
              });
              // DB trigger bumps conversations.message_count on insert; mirror
              // that locally so the header count stays correct between syncs.
              set((s) => ({
                conversations: s.conversations.map((c) =>
                  c.id === convId
                    ? { ...c, messageCount: (c.messageCount ?? 0) + 1 }
                    : c
                ),
              }));
              await touchConversation(dbConversationId);
              await logUsage({
                userId,
                conversationId: dbConversationId,
                messageId: null,
                model: usedFallback ? 'demo-fallback' : 'gemini-2.0-flash',
                tokensInput: tokensIn,
                tokensOutput: tokensOut,
                creditsUsed: 1,
                latencyMs: latency,
                success: true,
              });
            } catch (err) {
              console.warn('[M-Chat] assistant persist failed', err);
            }
          }

          // auto-title on first exchange — only when not in fallback mode
          if (
            conversation.messages.length <= 1 &&
            !usedFallback &&
            isValidGeminiKey(import.meta.env.VITE_GEMINI_API_KEY || '')
          ) {
            try {
              const provider = createAIProvider(
                'gemini',
                import.meta.env.VITE_GEMINI_API_KEY,
                get().settings.customInstructions,
                conversation.system_prompt || undefined
              );
              const allMessages = get()
                .conversations.find((c) => c.id === convId)?.messages || [];
              const title = await provider.generateTitle?.(allMessages);
              if (title && title !== 'New Conversation') {
                set((s) => ({
                  conversations: s.conversations.map((c) =>
                    c.id === convId ? { ...c, title } : c
                  ),
                }));
                if (dbConversationId) {
                  dbUpdateConversation(dbConversationId, { title }).catch(() => {});
                }
              }
            } catch {
              /* ignore title failures */
            }
          }

          if (get().settings.developerMode) {
            console.log('[M-Chat Dev]', {
              latency,
              tokensIn,
              tokensOut,
              usedFallback,
              fallbackReason,
              model: usedFallback ? 'demo-fallback' : 'gemini-2.0-flash',
            });
          }
        } catch (error) {
          // Should rarely happen because sendMessageWithFallback already
          // catches upstream errors, but we still want a safety net.
          const errorContent =
            error instanceof Error
              ? `Error: ${error.message}`
              : 'An unexpected error occurred. Please try again.';
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: errorContent, status: 'error' }
                        : m
                    ),
                  }
                : c
            ),
            aiStatus: 'error',
            isGenerating: false,
          }));
          get().addToast({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to get response',
          });
        }
      },

      stopGeneration: () => {
        set({
          isGenerating: false,
          aiStatus: 'online',
          conversations: get().conversations.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.status === 'streaming' ? { ...m, status: 'complete' } : m
            ),
          })),
        });
      },

      likeMessage: async (convId, msgId, liked) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, liked } : m
                  ),
                }
              : c
          ),
        }));
        if (isSupabaseConfigured && get().userId) {
          try {
            await dbUpdateMessage(msgId, { liked });
          } catch (err) {
            // Surface the failure so the user knows their click didn't
            // persist; otherwise the optimistic local update hides a real
            // sync error (RLS denial, network drop, etc.).
            console.warn('[M-Chat] likeMessage sync failed', err);
            get().addToast({
              type: 'error',
              message: 'Could not save your reaction. Please try again.',
            });
          }
        }
      },

      deleteMessage: async (convId, msgId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== msgId),
                  messageCount: Math.max(0, (c.messageCount ?? 0) - 1),
                }
              : c
          ),
        }));
        if (isSupabaseConfigured && get().userId) {
          try {
            await dbDeleteMessage(msgId);
          } catch (err) {
            console.warn('[M-Chat] deleteMessage sync failed', err);
            get().addToast({
              type: 'error',
              message: 'Message deleted locally — server sync failed.',
            });
          }
        }
      },

      // -------- UI --------
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
      toggleLimitModal: () => set((s) => ({ limitModalOpen: !s.limitModalOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),

      setTheme: async (theme) => {
        set((s) => ({ settings: { ...s.settings, theme } }));
        if (isSupabaseConfigured && get().userId) {
          await upsertSettings(get().userId!, { theme });
        }
      },

      updateSettings: async (newSettings) => {
        set((s) => ({
          settings: { ...s.settings, ...newSettings },
          developerMode: newSettings.developerMode ?? s.developerMode,
        }));
        if (isSupabaseConfigured && get().userId) {
          await upsertSettings(get().userId!, newSettings as Record<string, unknown>);
        }
      },

      resetSettings: async () => {
        set({ settings: { ...defaultSettings } });
        if (isSupabaseConfigured && get().userId) {
          await upsertSettings(get().userId!, defaultSettings as unknown as Record<string, unknown>);
        }
      },

      addToast: (toast) => {
        const id = generateId();
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 4000);
      },

      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      exportData: () => {
        const state = get();
        const data = {
          conversations: state.conversations,
          settings: state.settings,
          promptCount: state.promptCount,
          wallet: state.wallet,
          profile: state.profile,
          exportedAt: Date.now(),
          schema: 2,
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed?.conversations || !Array.isArray(parsed.conversations)) {
            return false;
          }
          set((s) => ({
            conversations: parsed.conversations,
            settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
            promptCount: parsed.promptCount ?? s.promptCount,
            wallet: parsed.wallet ?? s.wallet,
          }));
          // Best-effort: write settings back to DB if we're authed.
          if (isSupabaseConfigured && get().userId && parsed.settings) {
            upsertSettings(get().userId!, parsed.settings as Record<string, unknown>);
          }
          return true;
        } catch {
          return false;
        }
      },

      resetEverything: async () => {
        set({
          conversations: [],
          activeConversationId: null,
          promptCount: 0,
          settings: { ...defaultSettings },
          toasts: [],
        });
        if (isSupabaseConfigured && get().userId) {
          try {
            await supabase.from('conversations').delete().eq('user_id', get().userId!);
          } catch (err) {
            console.warn('[M-Chat] resetEverything failed', err);
          }
        }
      },
    }),
    {
      name: 'm-chat-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        promptCount: state.promptCount,
        settings: state.settings,
        sidebarOpen: state.sidebarOpen,
        userId: state.userId,
        isAuthed: state.isAuthed,
        wallet: state.wallet,
        isSyncing: false,
        hasBootstrapped: false,
        realtimeChannel: null,
      }),
    }
  )
);

// ---------------------------------------------------------------------------
// private helpers
// ---------------------------------------------------------------------------
function mergeConversations(local: Conversation[], remote: Conversation[]): Conversation[] {
  const byId = new Map<string, Conversation>();
  for (const r of remote) byId.set(r.id, r);
  for (const l of local) {
    const r = byId.get(l.id);
    if (!r) {
      byId.set(l.id, l);
    } else if (l.updatedAt > r.updatedAt) {
      byId.set(l.id, { ...r, ...l, synced: false });
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

function rowToMessage(row: any): ChatMessage {
  const atts = Array.isArray(row.attachments) ? row.attachments : [];
  return {
    id: row.id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    timestamp: new Date(row.created_at).getTime(),
    status: row.status as ChatMessage['status'],
    liked: row.liked,
    attachments: atts.length
      ? atts.map((a: any) => ({
          id: a.id,
          name: a.file_name,
          type: a.mime_type,
          size: Number(a.size_bytes ?? 0),
          url: a.public_url ?? '',
        }))
      : undefined,
  };
}

function mergeRemoteSettings(remote: SettingsRow, local: AppSettings): AppSettings {
  return {
    ...local,
    theme: (remote.theme as ThemeMode) ?? local.theme,
    language: remote.language ?? local.language,
    animationsEnabled: remote.animations_enabled,
    soundEnabled: remote.sound_enabled,
    fontSize: remote.font_size as AppSettings['fontSize'],
    developerMode: remote.developer_mode,
    enterToSend: remote.enter_to_send,
    streamResponses: remote.stream_responses,
    showTokenCounts: remote.show_token_counts,
    accentColor: remote.accent_color ?? local.accentColor,
    density: (remote.density as AppSettings['density']) ?? local.density,
    fontFamily: (remote.font_family as AppSettings['fontFamily']) ?? local.fontFamily,
    customInstructions: remote.custom_instructions ?? '',
  };
}

function guessAttachmentKind(mime: string): 'image' | 'video' | 'audio' | 'document' | 'code' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (
    mime.startsWith('text/') ||
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('xml') ||
    mime.includes('html')
  )
    return 'code';
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('document')) return 'document';
  return 'other';
}