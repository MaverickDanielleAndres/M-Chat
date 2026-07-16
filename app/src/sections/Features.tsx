import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  MessageSquare, Code2, Image, FileText, Mic, Brain,
  Zap, Globe, BarChart3, Sparkles,
} from 'lucide-react';
import { FEATURES } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  MessageSquare, Image, Code2, FileText, Mic,
  Brain, BarChart3, Briefcase: Zap, Presentation: Globe, Languages: Globe, Video: Sparkles,
};

// Bento layout: first card is 2-col span (featured), rest are 1-col
const accentColors: string[] = [
  'var(--m-accent-blue)',
  '#a78bfa',
  '#34d399',
  'var(--m-accent-amber)',
  '#f43f5e',
  '#60a5fa',
  '#fb923c',
  '#4ade80',
  '#e879f9',
  '#94a3b8',
  '#f9a8d4',
  '#67e8f9',
];

function FeatureCard({
  feature,
  index,
  isFeatured,
  inView,
}: {
  feature: typeof FEATURES[0];
  index: number;
  isFeatured: boolean;
  inView: boolean;
}) {
  const Icon = (iconMap[feature.icon] || Sparkles) as LucideIcon;
  const color = accentColors[index % accentColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`bento-card group relative rounded-2xl border border-border bg-card/60 p-0 overflow-hidden ${
        isFeatured ? 'md:col-span-2' : ''
      }`}
    >
      <Link 
        to={`/chat?prompt=${encodeURIComponent(`Show me how to use the ${feature.title} feature`)}`}
        className={`block w-full h-full focus:outline-none cursor-pointer ${isFeatured ? 'p-6 md:p-8' : 'p-6'}`}
      >
        {/* Icon */}
        <div
          className={`flex items-center justify-center rounded-xl mb-5 transition-transform duration-300 group-hover:scale-110 ${
            isFeatured ? 'w-14 h-14' : 'w-10 h-10'
          }`}
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon
            size={isFeatured ? 22 : 17}
            strokeWidth={1.5}
          />
        </div>

        {isFeatured && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-4 border"
            style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}
          >
            <Sparkles size={9} strokeWidth={2} />
            Core Feature
          </span>
        )}

        <h3
          className={`font-display font-semibold text-foreground mb-2 ${
            isFeatured ? 'text-[20px]' : 'text-[15px]'
          }`}
        >
          {feature.title}
        </h3>
        <p
          className={`text-muted-foreground leading-relaxed ${
            isFeatured ? 'text-[14px] max-w-md' : 'text-[13px]'
          }`}
        >
          {feature.description}
        </p>

        {/* Bottom accent line on hover */}
        <div
          className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }}
        />
      </Link>
    </motion.div>
  );
}

export function Features() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });
  const gridInView = useInView(gridRef, { once: true, margin: '-40px' });

  return (
    <section id="features" className="py-32 relative" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      {/* Subtle top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500 mb-4">
            Capabilities
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-[clamp(1.9rem,3.8vw,2.8rem)] font-display font-bold text-foreground leading-tight tracking-tight max-w-lg">
              Everything you need,{' '}
              <span className="gradient-text">nothing you don't.</span>
            </h2>
            <p className="text-[14px] text-muted-foreground max-w-xs leading-relaxed md:text-right">
              A complete AI toolkit built for creators, developers, and professionals.
            </p>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={i}
              isFeatured={i === 0}
              inView={gridInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
