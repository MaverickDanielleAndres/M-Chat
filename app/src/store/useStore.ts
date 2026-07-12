import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Conversation,
  ChatMessage,
  AppSettings,
  Toast,
  AIStatus,
  ThemeMode,
} from '@/types';
import { FREE_PROMPT_LIMIT } from '@/types';
import { createAIProvider, parseSSEStream, createDemoStream } from '@/services/ai';

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
  
  // Prompt Tracking
  promptCount: number;
  
  // Settings
  settings: AppSettings;
  
  // Toasts
  toasts: Toast[];

  // Actions
  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  pinConversation: (id: string) => void;
  duplicateConversation: (id: string) => void;
  clearAllConversations: () => void;
  
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  stopGeneration: () => void;
  likeMessage: (convId: string, msgId: string, liked: boolean) => void;
  deleteMessage: (convId: string, msgId: string) => void;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSettings: () => void;
  toggleLimitModal: () => void;
  setSearchQuery: (query: string) => void;
  
  setTheme: (theme: ThemeMode) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  exportData: () => string;
  importData: (data: string) => boolean;
  resetEverything: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  animationsEnabled: true,
  fontSize: 'medium',
  developerMode: false,
  soundEnabled: true,
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

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
      settings: { ...defaultSettings },
      toasts: [],

      createConversation: () => {
        const id = generateId();
        const newConv: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          const newActiveId =
            state.activeConversationId === id
              ? newConversations[0]?.id || null
              : state.activeConversationId;
          return {
            conversations: newConversations,
            activeConversationId: newActiveId,
          };
        });
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }));
      },

      pinConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        }));
      },

      duplicateConversation: (id) => {
        const state = get();
        const conv = state.conversations.find((c) => c.id === id);
        if (!conv) return;
        const newId = generateId();
        const newConv: Conversation = {
          ...conv,
          id: newId,
          title: `${conv.title} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({ conversations: [newConv, ...state.conversations], activeConversationId: newId });
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null });
      },

      sendMessage: async (content, _attachments) => {
        const state = get();
        
        // Check prompt limit
        if (state.promptCount >= FREE_PROMPT_LIMIT) {
          set({ limitModalOpen: true });
          return;
        }

        let convId = state.activeConversationId;
        if (!convId) {
          convId = get().createConversation();
        }

        const conversation = get().conversations.find((c) => c.id === convId);
        if (!conversation) return;

        // Create user message
        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: Date.now(),
          status: 'complete',
        };

        // Create assistant message placeholder
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'streaming',
        };

        // Update conversation with user message
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
        }));

        // Small delay to show "thinking" state
        await new Promise((r) => setTimeout(r, 400));

        // Update with assistant placeholder
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c
          ),
          aiStatus: 'generating',
          isGenerating: true,
        }));

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        const messagesForAPI = [...conversation.messages, userMessage].map((m) => ({
          ...m,
          status: 'complete' as const,
        }));

        try {
          let stream: ReadableStream<Uint8Array>;

          if (apiKey) {
            const provider = createAIProvider('gemini', apiKey);
            stream = await provider.sendMessage(messagesForAPI);
          } else {
            stream = createDemoStream(content);
          }

          let fullContent = '';
          const startTime = Date.now();

          for await (const chunk of parseSSEStream(stream)) {
            if (chunk.done) break;
            fullContent += chunk.content;

            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessage.id
                          ? { ...m, content: fullContent }
                          : m
                      ),
                    }
                  : c
              ),
            }));
          }

          const latency = Date.now() - startTime;

          // Mark as complete
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

          // Generate title if first exchange
          if (conversation.messages.length <= 2 && apiKey) {
            try {
              const provider = createAIProvider('gemini', apiKey);
              const allMessages = get()
                .conversations.find((c) => c.id === convId)?.messages || [];
              const title = await provider.generateTitle?.(allMessages);
              if (title && title !== 'New Conversation') {
                set((s) => ({
                  conversations: s.conversations.map((c) =>
                    c.id === convId ? { ...c, title } : c
                  ),
                }));
              }
            } catch {
              // Title generation failed, keep default
            }
          }

          // Developer stats
          if (get().settings.developerMode) {
            console.log('[M-Chat Dev]', { latency, tokens: fullContent.length, model: 'gemini-2.0-flash' });
          }
        } catch (error) {
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

      likeMessage: (convId, msgId, liked) => {
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
      },

      deleteMessage: (convId, msgId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.filter((m) => m.id !== msgId) }
              : c
          ),
        }));
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
      toggleLimitModal: () => set((s) => ({ limitModalOpen: !s.limitModalOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),

      setTheme: (theme) =>
        set((s) => ({
          settings: { ...s.settings, theme },
        })),

      updateSettings: (newSettings) =>
        set((s) => ({
          settings: { ...s.settings, ...newSettings },
          developerMode: newSettings.developerMode ?? s.developerMode,
        })),

      resetSettings: () => set({ settings: { ...defaultSettings } }),

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
          exportedAt: Date.now(),
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.conversations && Array.isArray(parsed.conversations)) {
            set({
              conversations: parsed.conversations,
              settings: parsed.settings || defaultSettings,
              promptCount: parsed.promptCount || 0,
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      resetEverything: () => {
        set({
          conversations: [],
          activeConversationId: null,
          promptCount: 0,
          settings: { ...defaultSettings },
          toasts: [],
        });
      },
    }),
    {
      name: 'm-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        promptCount: state.promptCount,
        settings: state.settings,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
