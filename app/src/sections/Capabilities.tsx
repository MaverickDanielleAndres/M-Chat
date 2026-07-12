import { motion } from 'framer-motion';
import {
  Type, Image as ImageIcon, Video, Mic, FileText, File, FileSpreadsheet,
  Presentation, Database, Code, Layout, MonitorSmartphone, Braces,
  Terminal, Brain, Globe, FileSignature, Lightbulb, Sparkles, LineChart,
  Network, Bug, FileCode2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Capability = {
  label: string;
  icon: LucideIcon;
};

const capabilities: Capability[] = [
  { label: 'Text', icon: Type },
  { label: 'Images', icon: ImageIcon },
  { label: 'Video', icon: Video },
  { label: 'Audio', icon: Mic },
  { label: 'PDF', icon: FileText },
  { label: 'Word', icon: File },
  { label: 'Excel', icon: FileSpreadsheet },
  { label: 'PowerPoint', icon: Presentation },
  { label: 'CSV', icon: Database },
  { label: 'JSON', icon: Braces },
  { label: 'XML', icon: Code },
  { label: 'Markdown', icon: FileCode2 },
  { label: 'HTML', icon: Layout },
  { label: 'CSS', icon: Layout },
  { label: 'JavaScript', icon: Code },
  { label: 'TypeScript', icon: Code },
  { label: 'React', icon: MonitorSmartphone },
  { label: 'Next.js', icon: MonitorSmartphone },
  { label: 'Node.js', icon: Terminal },
  { label: 'Python', icon: Terminal },
  { label: 'Java', icon: Terminal },
  { label: 'PHP', icon: Terminal },
  { label: 'SQL', icon: Database },
  { label: 'OCR', icon: FileSignature },
  { label: 'Translation', icon: Globe },
  { label: 'Summaries', icon: FileText },
  { label: 'Brainstorming', icon: Lightbulb },
  { label: 'AI Reasoning', icon: Brain },
  { label: 'Coding', icon: Code },
  { label: 'Debugging', icon: Bug },
  { label: 'Image Generation', icon: Sparkles },
  { label: 'Charts', icon: LineChart },
  { label: 'Diagrams', icon: Network },
];

export function Capabilities() {
  return (
    <section id="features" className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      {/* Subtle background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--m-accent-blue)]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="mb-12">
          <p className="text-[11px] font-bold tracking-widest text-[var(--m-accent-blue)] uppercase mb-3">
            Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-[var(--m-text-primary)] mb-4 tracking-tight">
            30+ AI capabilities
          </h2>
          <p className="text-sm md:text-base text-[var(--m-text-secondary)]">
            From text and code to images and video. M-Chat handles it all.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.02 }}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 cursor-default"
            >
              <cap.icon size={14} className="text-[var(--m-accent-blue)] group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
              <span className="text-[12px] font-medium text-[var(--m-text-primary)] group-hover:text-white transition-colors">
                {cap.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
