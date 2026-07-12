import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_PLANS } from '@/types';

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="pricing" className="py-32 bg-[#050507] relative">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--m-accent-blue)] mb-3">
            Pricing
          </p>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-[var(--m-text-primary)] leading-tight tracking-tight mb-4">
            Simple pricing
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex p-0.5 rounded-lg bg-[var(--m-bg-card)] border border-white/[0.04]">
              <button
                onClick={() => setYearly(false)}
                className={cn(
                  'px-3 py-1 rounded-md text-[12px] font-medium transition-all',
                  !yearly ? 'bg-[var(--m-text-primary)] text-[var(--m-text-inverse)]' : 'text-[var(--m-text-secondary)]'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={cn(
                  'px-3 py-1 rounded-md text-[12px] font-medium transition-all flex items-center gap-1',
                  yearly ? 'bg-[var(--m-text-primary)] text-[var(--m-text-inverse)]' : 'text-[var(--m-text-secondary)]'
                )}
              >
                Yearly
                <span className="text-[9px] text-[var(--m-accent-green)]">-20%</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUBSCRIPTION_PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                'relative rounded-2xl border p-6 flex flex-col',
                plan.highlight
                  ? 'border-[var(--m-accent-blue)]/20 bg-[var(--m-accent-blue-soft)]'
                  : 'border-white/[0.04] bg-[var(--m-bg-card)]/30'
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-2.5 left-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--m-accent-blue)] text-white">
                    Popular
                  </span>
                </div>
              )}

              <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)] mb-0.5">
                {plan.name}
              </h3>
              <p className="text-[12px] text-[var(--m-text-muted)] mb-5">
                {plan.description}
              </p>

              <div className="mb-5">
                <span className="text-3xl font-semibold text-[var(--m-text-primary)]">
                  ${yearly ? plan.price_yearly : plan.price_monthly}
                </span>
                <span className="text-[13px] text-[var(--m-text-muted)]">/mo</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px]">
                    <Check size={14} strokeWidth={1.5} className="text-[var(--m-accent-green)] flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--m-text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                  plan.highlight
                    ? 'bg-[var(--m-accent-blue)] text-white hover:opacity-90'
                    : 'border border-white/[0.08] text-[var(--m-text-primary)] hover:bg-white/[0.04]'
                )}
              >
                {plan.price_monthly === 0 ? 'Get Started' : 'Subscribe'}
                <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
