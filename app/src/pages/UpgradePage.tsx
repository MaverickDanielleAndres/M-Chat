import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router';
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  ChevronLeft,
  CreditCard,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  highlight?: boolean;
  features: string[];
  icon: any;
  accent: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try M-Chat at no cost',
    priceMonthly: 0,
    priceYearly: 0,
    icon: Sparkles,
    accent: 'from-slate-500 to-slate-700',
    features: [
      '10 prompts per day',
      'Basic AI chat',
      'Local chat history',
      'Text & code support',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For power users and creators',
    priceMonthly: 19,
    priceYearly: 190,
    highlight: true,
    icon: Zap,
    accent: 'from-indigo-500 to-violet-600',
    features: [
      'Unlimited prompts',
      'Priority responses',
      'Longer context window',
      'Image generation',
      'Voice conversations',
      'Larger uploads (50MB)',
      'Cloud storage (10GB)',
      'Custom GPTs',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'For teams and businesses',
    priceMonthly: 49,
    priceYearly: 490,
    icon: Crown,
    accent: 'from-amber-500 to-orange-600',
    features: [
      'Everything in Pro',
      'Early access features',
      'Advanced AI models',
      'Unlimited storage',
      'Projects & folders',
      'Team workspace',
      'API access',
      'White-label options',
      'Dedicated support',
    ],
  },
];

export function UpgradePage() {
  const navigate = useNavigate();
  const { isAuthed, profile, updateSettings, addToast } = useStore();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      addToast({ type: 'info', message: 'You are on the Free plan' });
      return;
    }
    setLoadingPlan(planId);
    try {
      // Placeholder for Stripe Checkout integration.
      // In production, call your edge function /api/stripe/checkout
      // which creates a Checkout Session and returns its URL.
      // For now, simulate a successful upgrade.
      await new Promise((r) => setTimeout(r, 900));
      addToast({
        type: 'success',
        message: `Stripe checkout would open for the ${planId} plan — payment integration coming soon.`,
      });
      // In a real integration:
      // const res = await fetch('/api/stripe/checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ plan_id: planId, billing }),
      // });
      // const { url } = await res.json();
      // window.location.href = url;
    } catch (err) {
      addToast({ type: 'error', message: 'Could not start checkout. Please try again.' });
    } finally {
      setLoadingPlan(null);
    }
  };

  // Local toast helper (re-uses the store)
  void updateSettings;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>
          <Link to="/chat" className="flex items-center gap-2">
            <img src="/logonobg.png" alt="M-Chat" className="w-7 h-7 rounded-md" />
            <span className="font-semibold text-sm">M-Chat</span>
          </Link>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-card text-muted-foreground mb-3"
          >
            <Sparkles size={11} className="text-indigo-500" />
            Upgrade to Pro
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Unlock everything M-Chat can do
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Pick a plan that fits your workflow. Cancel anytime. 7-day money-back guarantee.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex mt-6 p-1 rounded-full border border-border bg-card">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors',
                  billing === b
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {b === 'monthly' ? 'Monthly' : 'Yearly'}
                {b === 'yearly' && (
                  <span
                    className={cn(
                      'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full',
                      billing === b
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    Save ~17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = billing === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
            const isCurrent = (plan.id === 'free' && !isAuthed) ||
              (isAuthed && profile?.subscription_tier === plan.id);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={cn(
                  'relative rounded-2xl border bg-card p-5 sm:p-6 flex flex-col',
                  plan.highlight
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'border-border'
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-semibold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br',
                      plan.accent
                    )}
                  >
                    <Icon size={15} />
                  </div>
                  <h2 className="text-base font-semibold">{plan.name}</h2>
                </div>
                <p className="text-[12px] text-muted-foreground mb-4">{plan.tagline}</p>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                      ${price}
                    </span>
                    <span className="text-[12px] text-muted-foreground">/month</span>
                  </div>
                  {billing === 'yearly' && plan.priceYearly > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Billed ${plan.priceYearly}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12.5px] text-foreground">
                      <Check
                        size={13}
                        className={cn(
                          'flex-shrink-0 mt-0.5',
                          plan.highlight ? 'text-indigo-500' : 'text-emerald-500'
                        )}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loadingPlan === plan.id || isCurrent}
                  className={cn(
                    'w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5',
                    isCurrent
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : plan.highlight
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-sm shadow-indigo-500/30'
                      : 'bg-foreground text-background hover:opacity-90',
                    loadingPlan === plan.id && 'opacity-70'
                  )}
                >
                  {loadingPlan === plan.id ? (
                    'Opening checkout…'
                  ) : isCurrent ? (
                    'Current plan'
                  ) : plan.id === 'free' ? (
                    'Get started'
                  ) : (
                    <>
                      <CreditCard size={14} /> Upgrade to {plan.name}
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Shield size={13} /> 7-day money-back guarantee
          </span>
          <span className="hidden sm:inline">·</span>
          <span>Cancel anytime</span>
          <span className="hidden sm:inline">·</span>
          <span>Secure checkout via Stripe</span>
        </div>

        {/* FAQ */}
        <div className="mt-14 sm:mt-20">
          <h2 className="text-xl font-semibold text-center mb-6">Frequently asked questions</h2>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            <FAQ q="Can I cancel anytime?" a="Yes. Cancel from your account settings at any time and keep access until the end of your billing period." />
            <FAQ q="Do unused prompts roll over?" a="Daily prompts reset each day. Monthly Pro plans include 2,000 credits that do not expire during the billing cycle." />
            <FAQ q="Is my data safe?" a="Yes. Conversations are stored encrypted at rest in our Supabase project and never sold or used to train models without your consent." />
            <FAQ q="Do you offer refunds?" a="Yes. Full refund within 7 days of purchase, no questions asked." />
          </div>
        </div>
      </main>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[13px] font-medium mb-1">{q}</p>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{a}</p>
    </div>
  );
}