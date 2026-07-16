import { useStore } from '@/store/useStore';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Footer() {
  const { wallet, isAuthed, profile } = useStore();
  const navigate = useNavigate();
  const unlimited = wallet.daily_quota === -1;
  const atLimit = !unlimited && wallet.daily_used >= wallet.daily_quota;
  const tier = profile?.subscription_tier ?? 'free';

  if (atLimit && (tier === 'free' || tier === 'registered')) {
    return (
      <footer className="flex-shrink-0 border-t border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-center sm:text-left">
          <p className="text-[11px] sm:text-[12px] text-muted-foreground">
            You&apos;ve used your free prompts for today.
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Upgrade <ArrowRight size={10} strokeWidth={2} />
          </button>
        </div>
      </footer>
    );
  }

  if (!isAuthed) {
    return (
      <footer className="flex-shrink-0 py-2 border-t border-border/60 bg-background">
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <button onClick={() => navigate('/signup')} className="hover:text-foreground transition-colors">
            Sign up
          </button>
          <span className="text-border">·</span>
          <button onClick={() => navigate('/login')} className="hover:text-foreground transition-colors">
            Log in
          </button>
          <img
            src="/logonobg.png"
            alt="M-Chat"
            className="w-4 h-4 opacity-70"
          />
        </div>
      </footer>
    );
  }

  return (
    <footer className="flex-shrink-0 py-2 border-t border-border/60 bg-background">
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span>M-Chat v1.0</span>
        <img
          src="/logonobg.png"
          alt="M-Chat"
          className="w-4 h-4 opacity-70"
        />
      </div>
    </footer>
  );
}