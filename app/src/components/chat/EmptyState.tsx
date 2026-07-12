import { motion } from 'framer-motion';
import { Code2, FileText, Image, Bug, Lightbulb, Database, Languages, Mail, TrendingUp, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';

const suggestions = [
  { icon: Code2, label: 'Explain Code', prompt: 'Explain this code step by step:\n\n```\n// Paste your code here\n```' },
  { icon: FileText, label: 'Summarize PDF', prompt: 'Please summarize the key points from this document.' },
  { icon: Image, label: 'Analyze Image', prompt: 'Describe what you see in this image and analyze it.' },
  { icon: Bug, label: 'Fix Bug', prompt: 'Help me debug this issue:\n\n' },
  { icon: Lightbulb, label: 'Brainstorm', prompt: 'Help me brainstorm ideas for...' },
  { icon: Database, label: 'Write SQL', prompt: 'Write a SQL query that...' },
  { icon: Languages, label: 'Translate', prompt: 'Translate this:\n\n' },
  { icon: Mail, label: 'Write Email', prompt: 'Write a professional email about...' },
  { icon: TrendingUp, label: 'Business Plan', prompt: 'Help me create a business plan for...' },
  { icon: Sparkles, label: 'Generate React', prompt: 'Create a React component that...' },
];

export function EmptyState() {
  const { sendMessage } = useStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
        <img src="/empty-state.png" alt="" className="w-32 h-32 mx-auto opacity-[0.06] pointer-events-none mb-4" />
        <h1 className="text-xl font-semibold text-[var(--m-text-primary)] mb-1.5">How can I help?</h1>
        <p className="text-[13px] text-[var(--m-text-muted)]">Think Faster. Create Smarter.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full max-w-2xl">
        {suggestions.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 + i * 0.03 }}
              onClick={() => sendMessage(card.prompt)}
              className="suggestion-card flex flex-col items-start gap-2 p-4 rounded-2xl text-left bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all"
            >
              <Icon size={18} strokeWidth={1.5} className="text-[var(--m-accent-blue)]" />
              <span className="text-[12px] font-medium text-[var(--m-text-primary)]">{card.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
