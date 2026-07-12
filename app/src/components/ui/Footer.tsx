import { useStore } from '@/store/useStore';
import { FREE_PROMPT_LIMIT } from '@/types';
import { ArrowRight } from 'lucide-react';

export function Footer() {
  const { promptCount } = useStore();
  const isLimitReached = promptCount >= FREE_PROMPT_LIMIT;
  const portfolioUrl = import.meta.env.VITE_PORTFOLIO_URL || '#';
  const contactUrl = import.meta.env.VITE_CONTACT_URL || '#';

  if (isLimitReached) {
    return (
      <footer className="flex-shrink-0 border-t border-white/[0.04] bg-[var(--m-bg-elevated)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-[12px] text-[var(--m-text-secondary)] mb-0.5">Need your own AI platform?</p>
            <p className="text-[11px] text-[var(--m-text-muted)]">Built by Maverick Danielle Andres</p>
          </div>
          <div className="flex gap-2">
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90 transition-opacity">
              Portfolio <ArrowRight size={10} strokeWidth={1.5} />
            </a>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-white/[0.06] text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="flex-shrink-0 py-2 border-t border-white/[0.04] bg-[var(--m-bg-base)]">
      <p className="text-center text-[10px] text-[var(--m-text-muted)]">
        Built with Qwen AI
      </p>
    </footer>
  );
}
