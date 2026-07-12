import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Copy, Check, Trash2, User, Bot } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { cn, copyToClipboard, formatDate } from '@/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useStore } from '@/store/useStore';

interface Props {
  message: ChatMessage;
  conversationId: string;
  isLast: boolean;
}

export const ChatBubble = memo(function ChatBubble({ message, conversationId, isLast }: Props) {
  const { likeMessage, deleteMessage } = useStore();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  const handleCopy = async () => {
    if (await copyToClipboard(message.content)) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cn('py-3', isUser ? 'pl-8 sm:pl-16' : 'pr-8 sm:pr-16')}>
      <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar */}
        <div className={cn('flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5', isUser ? 'bg-[var(--m-accent-blue)]/10' : 'bg-white/[0.06]')}>
          {isUser ? <User size={12} className="text-[var(--m-accent-blue)]" strokeWidth={1.5} /> : <Bot size={12} className="text-[var(--m-text-muted)]" strokeWidth={1.5} />}
        </div>

        {/* Content */}
        <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
          <div className={cn('inline-block text-left max-w-full', isUser ? 'bg-white/[0.04] rounded-2xl px-4 py-2.5 border border-white/[0.04]' : '')}>
            {isError ? (
              <div className="text-[13px] text-[var(--m-accent-red)]">{message.content}</div>
            ) : (
              <div className={cn('prose prose-sm max-w-none dark:prose-invert', isStreaming && isLast && 'streaming-cursor')}>
                <MarkdownRenderer content={message.content} isStreaming={isStreaming && isLast} />
              </div>
            )}
          </div>

          {!isUser && message.status === 'complete' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
              <ActionBtn onClick={handleCopy} label="Copy">{copied ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}</ActionBtn>
              <ActionBtn onClick={() => likeMessage(conversationId, message.id, true)} label="Like" active={message.liked === true} activeClass="text-[var(--m-accent-green)]"> <ThumbsUp size={12} strokeWidth={1.5} /> </ActionBtn>
              <ActionBtn onClick={() => likeMessage(conversationId, message.id, false)} label="Dislike" active={message.liked === false} activeClass="text-[var(--m-accent-red)]"> <ThumbsDown size={12} strokeWidth={1.5} /> </ActionBtn>
              <ActionBtn onClick={() => deleteMessage(conversationId, message.id)} label="Delete"> <Trash2 size={12} strokeWidth={1.5} /> </ActionBtn>
              <span className="text-[10px] text-[var(--m-text-muted)] ml-1">{formatDate(message.timestamp)}</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

function ActionBtn({ onClick, label, children, active, activeClass }: any) {
  return (
    <button onClick={onClick} aria-label={label}
      className={cn('p-1.5 rounded-lg transition-colors', active ? activeClass : 'text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.04]')}>
      {children}
    </button>
  );
}
