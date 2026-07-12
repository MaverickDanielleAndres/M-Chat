import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Mic, Send, Square, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { FREE_PROMPT_LIMIT } from '@/types';

export function ChatInput() {
  const { sendMessage, isGenerating, stopGeneration, promptCount } = useStore();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLimitReached = promptCount >= FREE_PROMPT_LIMIT;

  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating || isLimitReached) return;
    const content = input.trim();
    setInput(''); setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(content, attachments.length > 0 ? attachments : undefined);
  }, [input, isGenerating, isLimitReached, attachments, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-3 pt-2 safe-area-bottom">
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] bg-white/[0.03] border border-white/[0.06] text-[var(--m-text-primary)]">
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="p-0.5 rounded hover:bg-white/[0.06] text-[var(--m-text-muted)]"><X size={10} strokeWidth={1.5} /></button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-end gap-1.5 rounded-2xl border border-white/[0.06] bg-[var(--m-bg-elevated)] p-2 transition-all focus-within:border-[var(--m-accent-blue)]/20">
        <button onClick={() => fileInputRef.current?.click()} disabled={isGenerating || isLimitReached}
          className="p-2 rounded-xl text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.04] transition-colors disabled:opacity-30 flex-shrink-0">
          <Paperclip size={17} strokeWidth={1.5} />
        </button>
        <input ref={fileInputRef} type="file" multiple onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) setAttachments((p) => [...p, ...f]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="hidden" />

        <textarea ref={textareaRef} value={input}
          onChange={(e) => { if (e.target.value.length <= 4000) setInput(e.target.value); }}
          onKeyDown={handleKeyDown}
          placeholder={isLimitReached ? 'Limit reached' : isRecording ? 'Listening...' : 'Message M-Chat...'}
          disabled={isGenerating || isLimitReached} rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-[13px] py-2 text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] disabled:opacity-40 max-h-[200px] overflow-y-auto"
        />

        <button onClick={() => setIsRecording(!isRecording)} disabled={isGenerating || isLimitReached}
          className={cn('p-2 rounded-xl transition-colors flex-shrink-0 disabled:opacity-30', isRecording ? 'text-[var(--m-accent-red)]' : 'text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.04]')}>
          {isRecording ? <Loader2 size={17} className="animate-spin" strokeWidth={1.5} /> : <Mic size={17} strokeWidth={1.5} />}
        </button>

        {isGenerating ? (
          <button onClick={stopGeneration} className="p-2 rounded-xl bg-[var(--m-accent-red)]/10 text-[var(--m-accent-red)] hover:bg-[var(--m-accent-red)]/20 transition-colors flex-shrink-0">
            <Square size={15} strokeWidth={1.5} />
          </button>
        ) : (
          <button onClick={handleSend} disabled={!input.trim() || isLimitReached}
            className={cn('p-2 rounded-xl flex-shrink-0 transition-all', input.trim() ? 'bg-[var(--m-accent-blue)] text-white hover:opacity-90' : 'text-[var(--m-text-muted)]', 'disabled:opacity-30')}>
            <Send size={15} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="flex justify-center mt-1.5">
        <span className="text-[10px] text-[var(--m-text-muted)]">Gemini AI</span>
      </div>
    </div>
  );
}
