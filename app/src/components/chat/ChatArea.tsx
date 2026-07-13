import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  Zap,
  ChevronDown,
  Share2,
  Check,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { cn } from '@/lib/utils';
import { ChatBubble } from './ChatMessage';
import { EmptyState } from './EmptyState';
import { ChatInput } from './ChatInput';
import { NotificationsPanel } from '@/components/ui/NotificationsPanel';

export function ChatArea() {
  const {
    conversations,
    activeConversationId,
    aiStatus,
    isGenerating,
    wallet,
    addToast,
  } = useStore();
  const conversation = conversations.find((c) => c.id === activeConversationId);
  const messages = conversation?.messages || [];
  const hasMessages = messages.length > 0;

  const { containerRef, isAtBottom, handleScroll, scrollToBottom } = useAutoScroll([
    messages.length,
    messages[messages.length - 1]?.content,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    online: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Wifi, label: 'Online' },
    thinking: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Activity, label: 'Thinking' },
    generating: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: Zap, label: 'Generating' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle, label: 'Error' },
    offline: { color: 'text-muted-foreground', bg: 'bg-muted/40', icon: WifiOff, label: 'Offline' },
  };
  const s = statusConfig[aiStatus] || statusConfig.offline;
  const StatusIcon = s.icon;

  const handleShareConversation = async () => {
    if (!conversation) return;
    const url = `${window.location.origin}/#/chat?c=${conversation.id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast({ type: 'success', message: 'Conversation link copied' });
    } catch {
      addToast({ type: 'info', message: url });
    }
  };

  const unlimited = wallet.daily_quota === -1;

  return (
    <div className="flex flex-col h-full relative bg-background">
      {/* Header — hamburger removed: collapsed sidebar has its own expand trigger */}
      <header className="flex items-center justify-between px-3 sm:px-4 h-12 border-b border-border/60 flex-shrink-0 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] sm:text-sm font-medium truncate text-foreground">
              {conversation?.title || 'New Conversation'}
            </h2>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              {!unlimited && wallet.daily_quota > 0 && ` · ${wallet.daily_used}/${wallet.daily_quota} prompts today`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationsPanel />
          <button
            onClick={handleShareConversation}
            disabled={!conversation}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Share conversation"
            title="Copy conversation link"
          >
            <Share2 size={15} />
          </button>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ml-1',
              s.bg,
              s.color
            )}
          >
            <StatusIcon
              size={10}
              className={cn(aiStatus === 'thinking' && 'status-thinking', aiStatus === 'generating' && 'animate-pulse')}
            />
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  conversationId={conversation!.id}
                  isLast={i === messages.length - 1}
                />
              ))}
            </AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-4 flex items-center gap-2 text-[13px] text-muted-foreground"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500/15 flex items-center justify-center">
                  <Zap size={10} className="text-indigo-400" strokeWidth={1.5} />
                </div>
                <span>Generating…</span>
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="typing-dot w-1 h-1 rounded-full bg-current" />
                  <span className="typing-dot w-1 h-1 rounded-full bg-current" />
                  <span className="typing-dot w-1 h-1 rounded-full bg-current" />
                </span>
              </motion.div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {!isAtBottom && hasMessages && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 p-2 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-foreground transition-colors z-10 shadow-lg"
            aria-label="Scroll to bottom"
          >
            <ChevronDown size={16} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input — hidden when EmptyState is shown to avoid duplicate composer */}
      {hasMessages && (
        <div className="flex-shrink-0 border-t border-border/60 bg-background">
          <ChatInput />
        </div>
      )}
    </div>
  );
}

// used as noop for compatibility
const _noop = () => null;
void Check;
void _noop;