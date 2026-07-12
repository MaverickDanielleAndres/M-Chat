import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-32 relative" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e1a] via-[#0f0f18] to-[#0a0a14]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--m-accent-blue)]/10 via-transparent to-[#a78bfa]/8" />

          {/* Ambient orbs inside card */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-[var(--m-accent-blue)]/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-[#a78bfa]/12 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[var(--m-accent-amber)]/5 blur-3xl" />

          {/* Border */}
          <div className="absolute inset-0 rounded-3xl border border-white/[0.07]" />

          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 py-20 px-10 lg:py-28 lg:px-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium mb-6 border border-[var(--m-accent-blue)]/20 bg-[var(--m-accent-blue)]/8 text-[var(--m-accent-blue)]"
            >
              <Sparkles size={11} strokeWidth={2} />
              Free to start — no credit card
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-[clamp(2rem,4.5vw,3.5rem)] font-display font-bold text-white leading-tight tracking-tight mb-5"
            >
              Ready to think{' '}
              <span className="shimmer-text">faster?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[15px] text-white/50 max-w-md mx-auto mb-10 leading-relaxed"
            >
              Join thousands of professionals using M-Chat daily to code faster,
              research smarter, and create more.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                to="/chat"
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[14px] font-semibold bg-[var(--m-accent-blue)] text-white hover:bg-[#4f52e0] transition-all duration-200 shadow-lg shadow-[var(--m-accent-blue)]/30 hover:shadow-[var(--m-accent-blue)]/50 hover:-translate-y-0.5"
              >
                Start for free
                <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-[14px] font-medium border border-white/[0.1] text-white/70 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.04] transition-all duration-200"
              >
                Create free account
              </Link>
            </motion.div>

            {/* Mini social proof */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-8 text-[12px] text-white/25"
            >
              Trusted by engineers at Stripe, Linear, Vercel, Anthropic & more
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
