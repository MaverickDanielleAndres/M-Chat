import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  { q: 'What is M-Chat?', a: 'M-Chat is a complete AI workspace for chat, code, images, documents, and more. One platform, endless possibilities.' },
  { q: 'Do I need to sign up?', a: 'No. M-Chat works immediately with 20 free prompts per day. Signing up gives you 50 prompts and cloud sync.' },
  { q: 'What AI model is used?', a: 'Qwen, one of the most advanced LLMs. Our architecture supports OpenAI, Claude, Gemini, and more coming soon.' },
  { q: 'Is my data secure?', a: 'Absolutely. Supabase with Row Level Security, JWT auth, and end-to-end encryption. SOC 2 compliant.' },
  { q: 'What files can I upload?', a: 'Images, PDFs, Word, Excel, CSV, JSON, Markdown, code files, and more. Pro users get video analysis.' },
  { q: 'How does Pro work?', a: 'Unlimited prompts, priority responses, image generation, voice conversations, and 10GB cloud storage.' },
  { q: 'Can I use it on mobile?', a: 'Yes. Fully responsive from 320px to 4K. Install as a PWA on your home screen.' },
  { q: 'Is there an API?', a: 'API access is available for Premium and Enterprise. Contact us for documentation and integrations.' },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="border-b border-white/[0.04] last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-4 text-left group hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[14px] font-medium text-[var(--m-text-primary)] pr-4">
          {faq.q}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.5}
          className={cn(
            'flex-shrink-0 text-[var(--m-text-muted)] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[13px] text-[var(--m-text-secondary)] leading-relaxed px-4 pb-5">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-16 md:py-24 bg-[var(--m-bg-elevated)] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--m-accent-blue)]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--m-accent-blue)] mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-[var(--m-text-primary)] tracking-tight">
            Common questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl border border-white/[0.05] hover:border-[var(--m-accent-blue)]/40 bg-[var(--m-bg-card)]/40 shadow-2xl hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.25)] transition-all duration-500 overflow-hidden backdrop-blur-sm"
        >
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
