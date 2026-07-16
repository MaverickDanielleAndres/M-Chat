import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Mic, Send, Square, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { stt, SpeechToText } from '@/services/voice';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB default

export function ChatInput() {
  const { sendMessage, isGenerating, stopGeneration, wallet, settings, addToast } = useStore();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const sttSupported = SpeechToText.isSupported();
  const dailyQuota = wallet.daily_quota;
  const unlimited = dailyQuota === -1;
  const atLimit = !unlimited && wallet.daily_used >= dailyQuota;

  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${Math.min(t.scrollHeight, 220)}px`;
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating || atLimit) return;
    const content = input.trim();
    const files = attachments;
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(content, files.length > 0 ? files : undefined);
  }, [input, isGenerating, atLimit, attachments, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!settings.enterToSend) return;
      e.preventDefault();
      handleSend();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        console.warn('[M-Chat] skipping oversized file', f.name);
        return false;
      }
      return true;
    });
    if (valid.length) setAttachments((p) => [...p, ...valid].slice(0, 8));
  };

  // drag/drop
  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.target === zone) setDragActive(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer?.files ?? null);
    };
    zone.addEventListener('dragover', onDragOver);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('drop', onDrop);
    return () => {
      zone.removeEventListener('dragover', onDragOver);
      zone.removeEventListener('dragleave', onDragLeave);
      zone.removeEventListener('drop', onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={dropZoneRef} className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 pt-2 safe-area-pb">
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-wrap gap-2 mb-2"
          >
            {attachments.map((file, i) => {
              const isImage = file.type.startsWith('image/');
              const url = isImage ? URL.createObjectURL(file) : null;
              return (
                <motion.div
                  key={`${file.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm text-xs"
                >
                  <div className="w-7 h-7 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {url ? (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-4 h-4 m-auto text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate max-w-[140px] font-medium">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}
                    className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'relative flex items-center gap-1.5 rounded-2xl border bg-card/80 backdrop-blur-sm p-2 transition-all',
          isFocused
            ? 'border-indigo-500/40 shadow-md shadow-indigo-500/10'
            : 'border-border/60',
          dragActive && 'ring-2 ring-indigo-500/40 border-indigo-500/60'
        )}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating || atLimit}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 flex-shrink-0"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip size={17} strokeWidth={1.5} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= 8000) setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            atLimit
              ? 'Daily limit reached — upgrade to keep chatting'
              : dragActive
              ? 'Drop files to attach…'
              : 'Message M-Chat… (Shift+Enter for newline)'
          }
          disabled={isGenerating || atLimit}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent outline-none text-[13px] sm:text-sm py-2.5 text-foreground',
            'placeholder:text-muted-foreground disabled:opacity-40 max-h-[220px] overflow-y-auto'
          )}
        />

        <button
          onClick={() => {
            if (!sttSupported) {
              addToast({
                type: 'warning',
                message: 'Voice input is not supported in this browser.',
              });
              return;
            }
            if (isListening) {
              stt.stop();
              setIsListening(false);
              return;
            }
            stt.start({
              language:
                settings.language === 'en'
                  ? 'en-US'
                  : settings.language || 'en-US',
              continuous: false,
              onResult: (transcript, isFinal) => {
                if (isFinal) {
                  setInput((prev) =>
                    prev.trim() ? `${prev.trim()} ${transcript}` : transcript
                  );
                }
              },
              onError: (err) => {
                addToast({ type: 'error', message: `Voice error: ${err}` });
                setIsListening(false);
              },
              onEnd: () => setIsListening(false),
            });
            setIsListening(true);
          }}
          disabled={isGenerating || atLimit}
          className={cn(
            'p-2 rounded-xl transition-colors flex-shrink-0 hidden sm:inline-flex items-center justify-center',
            isListening
              ? 'text-red-400 bg-red-500/15 animate-pulse'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30'
          )}
          title={isListening ? 'Stop listening' : 'Start voice input'}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          aria-pressed={isListening}
        >
          <Mic size={17} strokeWidth={1.5} />
        </button>

        {isGenerating ? (
          <button
            onClick={stopGeneration}
            className="p-2.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors flex-shrink-0"
            title="Stop generating"
          >
            <Square size={15} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || atLimit}
            className={cn(
              'p-2.5 rounded-xl flex-shrink-0 transition-all',
              input.trim() && !atLimit
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-sm shadow-indigo-500/20'
                : 'text-muted-foreground disabled:opacity-30'
            )}
            title="Send message"
          >
            <Send size={15} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="flex justify-center items-center flex-wrap gap-x-2 sm:gap-3 gap-y-0.5 mt-1.5 px-2">
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 whitespace-nowrap">
          <ImageIcon className="w-2.5 h-2.5" />
          Up to {Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB
        </span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">·</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">Gemini 2.5 Flash</span>
        {settings.showTokenCounts && (
          <>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">·</span>
            <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
              {Math.ceil(input.length / 4)} tokens
            </span>
          </>
        )}
        {!unlimited && wallet.daily_quota > 0 && (
          <>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className={cn('text-[10px] font-mono whitespace-nowrap', atLimit ? 'text-red-400' : 'text-muted-foreground')}>
              {wallet.daily_used}/{wallet.daily_quota} today
            </span>
          </>
        )}
      </div>
    </div>
  );
}