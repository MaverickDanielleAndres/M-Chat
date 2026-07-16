import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Trash2,
  User,
  Bot,
  FileText,
  Image as ImageIcon,
  FileCode,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ChatMessage, FileAttachment } from '@/types';
import { cn, copyToClipboard, formatDate, formatFileSize } from '@/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useStore } from '@/store/useStore';
import { tts, TextToSpeech } from '@/services/voice';

interface Props {
  message: ChatMessage;
  conversationId: string;
  isLast: boolean;
}

export const ChatBubble = memo(function ChatBubble({ message, conversationId, isLast }: Props) {
  const { likeMessage, deleteMessage } = useStore();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const ttsSupported = TextToSpeech.isSupported();

  const handleCopy = async () => {
    if (await copyToClipboard(message.content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      tts.stop();
      setIsSpeaking(false);
    } else {
      tts.speak(message.content, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  }, [isSpeaking, message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'py-4 chat-density group',
        isUser ? 'pl-8 sm:pl-16' : 'pr-8 sm:pr-16'
      )}
    >
      <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar */}
        <div
          className={cn(
            'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5',
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
              : 'bg-muted text-foreground'
          )}
        >
          {isUser ? (
            <User size={13} strokeWidth={2} />
          ) : (
            <Bot size={13} strokeWidth={2} />
          )}
        </div>

        {/* Content */}
        <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
          {/* attachments (user only) */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className={cn('flex flex-wrap gap-2 mb-2', isUser && 'justify-end')}>
              {message.attachments.map((att) => (
                <AttachmentChip key={att.id} attachment={att} />
              ))}
            </div>
          )}

          <div
            className={cn(
              'inline-block text-left max-w-full',
              isUser
                ? 'bg-muted/60 rounded-2xl px-4 py-2.5 border border-border/60'
                : ''
            )}
          >
            {isError ? (
              <div className="text-[13px] text-red-400 whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div
                className={cn(
                  'prose prose-sm max-w-none dark:prose-invert',
                  isStreaming && isLast && 'streaming-cursor'
                )}
              >
                <MarkdownRenderer content={message.content} isStreaming={isStreaming && isLast} />
              </div>
            )}
          </div>

          {/* Action toolbar (assistant only) */}
          {!isUser && message.status === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ActionBtn onClick={handleCopy} label="Copy">
                {copied ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
              </ActionBtn>
              {ttsSupported && (
                <ActionBtn
                  onClick={handleSpeak}
                  label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  active={isSpeaking}
                  activeClass="text-indigo-400"
                >
                  {isSpeaking ? <VolumeX size={12} strokeWidth={1.5} /> : <Volume2 size={12} strokeWidth={1.5} />}
                </ActionBtn>
              )}
              <ActionBtn
                onClick={() => likeMessage(conversationId, message.id, true)}
                label="Like"
                active={message.liked === true}
                activeClass="text-emerald-400"
              >
                <ThumbsUp size={12} strokeWidth={1.5} />
              </ActionBtn>
              <ActionBtn
                onClick={() => likeMessage(conversationId, message.id, false)}
                label="Dislike"
                active={message.liked === false}
                activeClass="text-red-400"
              >
                <ThumbsDown size={12} strokeWidth={1.5} />
              </ActionBtn>
              <ActionBtn
                onClick={() => deleteMessage(conversationId, message.id)}
                label="Delete"
              >
                <Trash2 size={12} strokeWidth={1.5} />
              </ActionBtn>
              <span className="text-[10px] text-muted-foreground ml-2">
                {formatDate(message.timestamp)}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

function ActionBtn({
  onClick,
  label,
  children,
  active,
  activeClass,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
        active
          ? activeClass
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      )}
    >
      {children}
    </button>
  );
}

function AttachmentChip({ attachment }: { attachment: FileAttachment }) {
  const isImage = attachment.type.startsWith('image/');
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-border/60 bg-card text-xs max-w-[220px]">
      <div className="w-7 h-7 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {isImage && attachment.url ? (
          <img src={attachment.url} alt="" className="w-full h-full object-cover" />
        ) : isImage ? (
          <ImageIcon className="w-4 h-4 m-auto text-muted-foreground" />
        ) : attachment.type.includes('text') || attachment.type.includes('json') ? (
          <FileCode className="w-4 h-4 m-auto text-muted-foreground" />
        ) : (
          <FileText className="w-4 h-4 m-auto text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate max-w-[140px] font-medium">{attachment.name}</p>
        <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>
    </div>
  );
}