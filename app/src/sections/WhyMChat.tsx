import { Shield, Zap, Lock, Smartphone, Puzzle, Cloud } from 'lucide-react';
import { WhyMChatCarousel } from './WhyMChatCarousel';

const reasons = [
  {
    id: 'speed',
    icon: Zap,
    label: 'Lightning Fast',
    description: 'Sub-second response times. Optimized for real-time productivity so you never lose your flow state.',
  },
  {
    id: 'privacy',
    icon: Shield,
    label: 'Privacy First',
    description: 'End-to-end encryption. Your data belongs to you, always. We never train models on your private workspaces.',
  },
  {
    id: 'security',
    icon: Lock,
    label: 'Enterprise Security',
    description: 'Row Level Security, JWT tokens, SOC 2 compliant architecture out of the box powered by Supabase.',
  },
  {
    id: 'responsive',
    icon: Smartphone,
    label: 'Works Everywhere',
    description: 'From 320px phones to 4K displays. Touch-optimized and PWA-ready for an app-like experience on any device.',
  },
  {
    id: 'agnostic',
    icon: Puzzle,
    label: 'Model Agnostic',
    description: 'Switch AI providers seamlessly. Use Qwen today, OpenAI tomorrow. Zero vendor lock-in for your business logic.',
  },
  {
    id: 'sync',
    icon: Cloud,
    label: 'Cloud Sync',
    description: 'Conversations sync across devices instantly. Pick up exactly where you left off on your phone or desktop.',
  },
];

export function WhyMChat() {
  return (
    <section className="py-16 md:py-24 bg-[var(--m-bg-elevated)] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--m-accent-blue)] mb-3">
            Why M-Chat
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-[var(--m-text-primary)] leading-[1.1] tracking-tight mb-5">
            Built for the future
          </h2>
        </div>

        <WhyMChatCarousel features={reasons} />
      </div>
    </section>
  );
}
