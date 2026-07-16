import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip,
  Mic,
  MicOff,
  Send,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Globe,
  Loader2,
} from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { stt, SpeechToText } from '@/services/voice';
import { detectImageGenerationIntent, generateImage } from '@/services/imageGen';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB default

export function ChatInput() {
  const {
    sendMessage,
    isGenerating,
    stopGeneration,
    wallet,
    settings,
    updateSettings,
    addToast,
  } = useStore();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  // Read the optional web-search toggle from settings. We expose it on
  // AppSettings so it persists with the rest of the user preferences.
  const webSearchEnabled = Boolean((settings as any).webSearchEnabled);

  const sttSupported = SpeechToText.isSupported();
  const dailyQuota = wallet.daily_quota;
  const unlimited = dailyQuota === -1;
  const atLimit = !unlimited && wallet.daily_used >= dailyQuota;

  // Auto-resize textarea
  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${Math.min(t.scrollHeight, 220)}px`;
  }, [input]);

  // Read prompt from URL (?prompt=...) so capability cards on the
  // landing page can deep-link into the chat with a starter prompt.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInput(prompt);
      const next = new URLSearchParams(searchParams);
      next.delete('prompt');
      setSearchParams(next, { replace: true });

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [searchParams, setSearchParams]);

  // Voice input
  const toggleVoice = useCallback(() => {
    if (!sttSupported) {
      addToast({ type: 'warning', message: 'Voice input not supported in this browser.' });
      return;
    }
    if (isListening) {
      stt.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      stt.start({
        language: settings.language === 'en' ? 'en-US' : settings.language,
        continuous: true,
        onResult: (transcript, isFinal) => {
          if (isFinal) {
            setInput((prev) => prev + (prev.trim() ? ' ' : '') + transcript);
            setInterimTranscript('');
          } else {
            setInterimTranscript(transcript);
          }
        },
        onError: (err) => {
          addToast({ type: 'error', message: `Voice error: ${err}` });
          setIsListening(false);
          setInterimTranscript('');
        },
        onEnd: () => {
          setIsListening(false);
          setInterimTranscript('');
        },
      });
      setIsListening(true);
    }
  }, [isListening, sttSupported, settings.language, addToast]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating || atLimit) return;
    const content = input.trim();

    // Stop voice if active
    if (isListening) {
      stt.stop();
      setIsListening(false);
    }

    // Image generation intent detection
    if (detectImageGenerationIntent(content)) {
      setInput('');
      setIsGeneratingImage(true);
      try {
        const results = await generateImage(content, { numberOfImages: 1 });
        setGeneratedImages(results.map((r) => r.imageUrl));
        // Also send as normal message so it appears in chat
        await sendMessage(content, attachments.length > 0 ? attachments : undefined);
        setAttachments([]);
        addToast({ type: 'success', message: 'Image generated!' });
      } catch (err) {
        // Fall back to normal message if image gen fails
        await sendMessage(content, attachments.length > 0 ? attachments : undefined);
        setAttachments([]);
        addToast({ type: 'info', message: 'Image generation unavailable — responded as text.' });
      } finally {
        setIsGeneratingImage(false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
      return;
    }

    const files = attachments;
    setInput('');
    setAttachments([]);
    setGeneratedImages([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(content, files.length > 0 ? files : undefined);
  }, [input, isGenerating, atLimit, attachments, sendMessage, isListening, addToast]);

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
        addToast({ type: 'warning', message: `${f.name} is too large (max 10MB)` });
        return false;
      }
      return true;
    });
    if (valid.length) setAttachments((p) => [...p, ...valid].slice(0, 8));
  };

  // Drag & drop
  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragActive(true); };
    const onDragLeave = (e: DragEvent) => { if (e.target === zone) setDragActive(false); };
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

  // Listen for a global "open attachments" event from the EmptyState so the
  // attach button there reuses this component's hidden file input.
  useEffect(() => {
    const handler = () => fileInputRef.current?.click();
    window.addEventListener('mchat:open-attachments', handler);
    return () => window.removeEventListener('mchat:open-attachments', handler);
  }, []);

  const displayValue = input + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <div ref={dropZoneRef} className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 pt-2 safe-area-pb">
      {/* Generated Images Preview */}
      <AnimatePresence>
        {generatedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-wrap gap-2 mb-2"
          >
            {generatedImages.map((imgUrl, i) => (
              <div key={i} className="relative group">
                <img
                  src={imgUrl}
                  alt={`Generated ${i + 1}`}
                  className="h-32 w-32 object-cover rounded-xl border border-border/60"
                />
                <button
                  onClick={() => setGeneratedImages((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments */}
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

      {/* Voice indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Listening{interimTranscript ? `… "${interimTranscript}"` : '…'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'relative flex items-center gap-1.5 rounded-2xl border bg-card/80 backdrop-blur-sm p-2 transition-all',
          isFocused
            ? 'border-indigo-500/40 shadow-md shadow-indigo-500/10'
            : 'border-border/60',
          dragActive && 'ring-2 ring-indigo-500/40 border-indigo-500/60',
          isListening && 'border-red-500/30 shadow-red-500/10'
        )}
      >
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating || atLimit || isGeneratingImage}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 flex-shrink-0"
          title="Attach file (image, PDF, code, etc.)"
          aria-label="Attach file"
        >
          <Paperclip size={17} strokeWidth={1.5} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.sql"
          onChange={(e) => {
            handleFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => {
            if (!isListening && e.target.value.length <= 8000) setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            atLimit
              ? 'Daily limit reached — upgrade to keep chatting'
              : isListening
              ? 'Speak now…'
              : dragActive
              ? 'Drop files to attach…'
              : isGeneratingImage
              ? 'Generating image…'
              : 'Message M-Chat… (Shift+Enter for newline, try "generate an image of…")'
          }
          disabled={isGenerating || atLimit || isListening || isGeneratingImage}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent outline-none text-[13px] sm:text-sm py-2.5 text-foreground',
            'placeholder:text-muted-foreground disabled:opacity-40 max-h-[220px] overflow-y-auto'
          )}
        />

        {/* Web search toggle — explicitly opt-in. Off by default so casual chats
            stay cheap, on for queries that need fresh facts. Persisted in
            app_settings via the camelCase→snake_case mapper. */}
        <button
          type="button"
          onClick={() => updateSettings({ webSearchEnabled: !webSearchEnabled })}
          className={cn(
            'w-9 h-9 inline-flex items-center justify-center rounded-xl flex-shrink-0 hidden sm:flex transition-colors',
            webSearchEnabled
              ? 'bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          )}
          title={webSearchEnabled ? 'Web search ON — click to disable' : 'Web search OFF — click to enable'}
          aria-label={webSearchEnabled ? 'Disable web search' : 'Enable web search'}
          aria-pressed={webSearchEnabled}
        >
          <Globe size={15} strokeWidth={1.5} />
        </button>

        {/* Voice */}
        {sttSupported && (
          <button
            onClick={toggleVoice}
            disabled={isGenerating || atLimit || isGeneratingImage}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 hidden sm:flex',
              isListening
                ? 'text-red-400 bg-red-500/15 hover:bg-red-500/25 animate-pulse'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30'
            )}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={17} strokeWidth={1.5} /> : <Mic size={17} strokeWidth={1.5} />}
          </button>
        )}

        {/* Image generation loading */}
        {isGeneratingImage && (
          <div className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0">
            <Loader2 size={15} className="text-indigo-400 animate-spin" strokeWidth={1.5} />
          </div>
        )}

        {/* Stop / Send */}
        {isGenerating ? (
          <button
            onClick={stopGeneration}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors flex-shrink-0"
            title="Stop generating"
          >
            <Square size={15} strokeWidth={1.5} />
          </button>
        ) : (
          !isGeneratingImage && (
            <button
              onClick={handleSend}
              disabled={!input.trim() || atLimit}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all',
                input.trim() && !atLimit
                  ? detectImageGenerationIntent(input)
                    ? 'bg-gradient-to-br from-violet-500 to-pink-600 text-white hover:opacity-90 shadow-sm shadow-violet-500/20'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-sm shadow-indigo-500/20'
                  : 'text-muted-foreground disabled:opacity-30'
              )}
              title={detectImageGenerationIntent(input) ? 'Generate image' : 'Send message'}
            >
              {detectImageGenerationIntent(input) ? (
                <Sparkles size={15} strokeWidth={1.5} />
              ) : (
                <Send size={15} strokeWidth={1.5} />
              )}
            </button>
          )
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