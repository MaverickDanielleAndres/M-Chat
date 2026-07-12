import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Activity, Wifi, WifiOff, AlertCircle, Zap, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { cn } from '@/lib/utils';
import { ChatBubble } from './ChatMessage';
import { EmptyState } from './EmptyState';
import { ChatInput } from './ChatInput';

export function ChatArea() {
  const { conversations, activeConversationId, sidebarOpen, aiStatus, isGenerating, toggleSidebar } = useStore();
  const conversation = conversations.find((c) => c.id === activeConversationId);
  const messages = conversation?.messages || [];
  const hasMessages = messages.length > 0;

  const { containerRef, isAtBottom, handleScroll, scrollToBottom } = useAutoScroll([
    messages.length, messages[messages.length - 1]?.content,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') e.preventDefault(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const statusConfig: Record<string, { color: string; bg: string }> = {
    online: { color: 'text-[var(--m-accent-green)]', bg: 'bg-[var(--m-accent-green)]/10' },
    thinking: { color: 'text-amber-400', bg: 'bg-amber-400/10' },
    generating: { color: 'text-[var(--m-accent-blue)]', bg: 'bg-[var(--m-accent-blue)]/10' },
    error: { color: 'text-[var(--m-accent-red)]', bg: 'bg-[var(--m-accent-red)]/10' },
    offline: { color: 'text-[var(--m-text-muted)]', bg: 'bg-white/[0.04]' },
  };
  const s = statusConfig[aiStatus] || statusConfig.offline;

  return (
    <div className="flex flex-col h-full relative bg-[var(--m-bg-base)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-white/[0.04] flex-shrink-0 bg-[var(--m-bg-base)]">
        <div className="flex items-center gap-2.5">
          {!sidebarOpen && (
            <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-[var(--m-text-muted)] transition-colors">
              <Menu size={18} strokeWidth={1.5} />
            </button>
          )}
          <div>
            <h2 className="text-[13px] font-medium text-[var(--m-text-primary)] truncate max-w-[200px] sm:max-w-md">
              {conversation?.title || 'M-Chat'}
            </h2>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium', s.bg, s.color)}>
          {aiStatus === 'online' && <Wifi size={10} strokeWidth={1.5} />}
          {aiStatus === 'thinking' && <Activity size={10} strokeWidth={1.5} className="status-thinking" />}
          {aiStatus === 'generating' && <Zap size={10} strokeWidth={1.5} className="animate-pulse" />}
          {aiStatus === 'error' && <AlertCircle size={10} strokeWidth={1.5} />}
          {aiStatus === 'offline' && <WifiOff size={10} strokeWidth={1.5} />}
          <span className="capitalize">{aiStatus}</span>
        </div>
      </header>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <div className="max-w-3xl mx-auto px-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatBubble key={msg.id} message={msg} conversationId={conversation!.id} isLast={i === messages.length - 1} />
              ))}
            </AnimatePresence>
            {isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 flex items-center gap-2 text-[13px] text-[var(--m-text-muted)]">
                <div className="w-5 h-5 rounded-full bg-[var(--m-accent-blue)]/10 flex items-center justify-center">
                  <Zap size={10} className="text-[var(--m-accent-blue)]" strokeWidth={1.5} />
                </div>
                <span>Generating...</span>
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
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom} className="absolute bottom-24 right-6 p-2 rounded-full border border-white/[0.06] bg-[var(--m-bg-elevated)] text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] transition-colors z-10"
            aria-label="Scroll to bottom">
            <ChevronDown size={16} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/[0.04] bg-[var(--m-bg-base)]">
        <ChatInput />
      </div>
    </div>
  );
}
