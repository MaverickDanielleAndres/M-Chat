'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  Code2,
  Palette,
  Layers,
  Rocket,
  Sparkles,
  Languages,
  Brain,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const next = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${next}px`;
    },
    [minHeight, maxHeight]
  );
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);
  return { textareaRef, adjustHeight };
}

const QUICK_ACTIONS = [
  { icon: Code2, label: 'Generate Code', prompt: 'Generate a React TypeScript component with shadcn/ui that...' },
  { icon: Rocket, label: 'Launch App', prompt: 'Help me plan and ship a side-project in 30 days. Ask me 5 questions first.' },
  { icon: Layers, label: 'UI Components', prompt: 'Design a modern dashboard layout with sidebar, top bar, and content area.' },
  { icon: Palette, label: 'Theme Ideas', prompt: 'Suggest 3 distinct color palettes for a calm productivity app.' },
  { icon: CircleUserRound, label: 'User Dashboard', prompt: 'Sketch the sections of a user dashboard for a SaaS product.' },
  { icon: MonitorIcon, label: 'Landing Page', prompt: 'Outline a landing page for an AI-powered writing tool.' },
  { icon: FileUp, label: 'Upload Docs', prompt: 'I will upload a document next. Summarize its key takeaways in 5 bullets.' },
  { icon: ImageIcon, label: 'Image Assets', prompt: 'Describe 5 hero-image concepts for a finance app.' },
  { icon: Sparkles, label: 'Generate Image', prompt: 'Generate an image of a futuristic green-energy city at golden hour.' },
  { icon: Languages, label: 'Translate', prompt: 'Translate this to Spanish, French, and Japanese: "Welcome to M-Chat."' },
  { icon: Brain, label: 'Reasoning', prompt: 'Solve step by step: A train leaves A at 9am at 60 km/h. Another leaves B (300 km away) at 10am toward A at 90 km/h. When do they meet?' },
  { icon: Code2, label: 'Debug', prompt: 'Help me debug this error: TypeError: Cannot read properties of undefined (reading "map") at UserList (UserList.tsx:12).' },
] as const;

export default function RuixenMoonChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  // Read prompt from URL
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setMessage(prompt);
      const next = new URLSearchParams(searchParams);
      next.delete('prompt');
      setSearchParams(next, { replace: true });
      
      setTimeout(() => {
        adjustHeight();
        textareaRef.current?.focus();
      }, 100);
    }
  }, [searchParams, setSearchParams, adjustHeight]);

  const sendMessage = useStore((s) => s.sendMessage);
  const isGenerating = useStore((s) => s.isGenerating);
  const wallet = useStore((s) => s.wallet);
  const addToast = useStore((s) => s.addToast);
  const isAuthed = useIsAuthed();

  const dailyQuota = wallet.daily_quota;
  const unlimited = dailyQuota === -1;
  const atLimit = !unlimited && wallet.daily_used >= dailyQuota;

  const handleSubmit = useCallback(() => {
    const content = message.trim();
    if (!content || isGenerating || atLimit) return;
    setMessage('');
    adjustHeight(true);
    void sendMessage(content);
  }, [message, isGenerating, atLimit, sendMessage, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const applyQuickAction = (label: string, prompt: string) => {
    setMessage(prompt);
    adjustHeight();
    requestAnimationFrame(() => textareaRef.current?.focus());
    addToast({ type: 'info', message: `${label} prompt loaded — press Enter to send` });
  };

  const handleAttach = () => {
    // Dispatch a global event that ChatInput listens for. This lets the
    // EmptyState's "attach" button reuse the same hidden <input type="file">
    // pipeline as the main composer, instead of being a placeholder toast.
    window.dispatchEvent(new CustomEvent('mchat:open-attachments'));
  };

  return (
    <div className="relative w-full h-full min-h-[60vh] flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-10 mesh-gradient">
      {/* Centered AI Title */}
      <div className="w-full flex flex-col items-center justify-center text-center mb-6 sm:mb-8">
        <img
          src="/logonobg.png"
          alt="M-Chat"
          className="w-12 h-12 sm:w-14 sm:h-14 mb-3 opacity-90"
        />
        <h1 className="text-2xl sm:text-4xl font-semibold text-foreground tracking-tight">
          M-Chat AI
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-muted-foreground max-w-md">
          Build something amazing — just start typing below.
        </p>
        {!isAuthed && !unlimited && wallet.daily_quota > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {wallet.daily_used}/{wallet.daily_quota} daily prompts · {wallet.balance} credits
          </p>
        )}
      </div>

      {/* Input Box Section */}
      <div className="w-full max-w-3xl">
        <div
          className={cn(
            'relative bg-card/80 backdrop-blur-md rounded-xl border border-border shadow-sm',
            atLimit && 'opacity-60'
          )}
        >
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              atLimit ? 'Daily limit reached — upgrade to keep chatting' : 'Type your request...'
            }
            disabled={isGenerating || atLimit}
            className={cn(
              'w-full px-4 py-3 resize-none border-none bg-transparent',
              'text-foreground text-sm',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'placeholder:text-muted-foreground min-h-[48px]'
            )}
            style={{ overflow: 'hidden' }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between p-3 border-t border-border/60">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAttach}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/60"
              aria-label="Attach file"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || isGenerating || atLimit}
                size="icon"
                aria-label="Send message"
                title="Send"
                className={cn(
                  message.trim() && !atLimit
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-sm shadow-indigo-500/30'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <ArrowUpIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-5 max-w-3xl mx-auto">
          {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
            <QuickAction
              key={label}
              icon={<Icon className="w-3.5 h-3.5" />}
              label={label}
              onClick={() => applyQuickAction(label, prompt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border-border bg-card/70 text-foreground hover:text-foreground hover:bg-muted/60 hover:border-indigo-500/30 transition-all"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

// We do need auth state here so the quota badge and the "upgrade" CTA
// hide for signed-in paid users. Reading from the same Zustand store the
// rest of the app uses.
const useIsAuthed = () => useStore((s) => s.isAuthed);