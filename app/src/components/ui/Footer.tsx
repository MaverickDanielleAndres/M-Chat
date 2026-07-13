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
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            You&apos;ve used your free prompts for today.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:opacity-90 transition-opacity"
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
        <p className="text-center text-[10px] text-muted-foreground">
          <button onClick={() => navigate('/signup')} className="hover:text-foreground transition-colors">
            Sign up
          </button>
          {' · '}
          <button onClick={() => navigate('/login')} className="hover:text-foreground transition-colors">
            Log in
          </button>
          {' · '}Built with Qwen AI
        </p>
      </footer>
    );
  }

  return (
    <footer className="flex-shrink-0 py-2 border-t border-border/60 bg-background">
      <p className="text-center text-[10px] text-muted-foreground">
        M-Chat v1.0 · Built with Qwen AI
      </p>
    </footer>
  );
}