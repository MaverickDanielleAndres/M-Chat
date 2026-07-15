import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  Type, Image, Video, AudioLines, FileText, FileSpreadsheet,
  Presentation, Table, Braces, Code, Palette, Boxes,
  Server, Coffee, Database, Eye, Languages, Sparkles,
  Lightbulb, Brain, Bug, Paintbrush, BarChart3,
  LayoutGrid, LayoutList
} from 'lucide-react';
import { AI_CAPABILITIES } from '@/types';
import { cn } from '@/lib/utils';
import PixelCard from '@/components/ui/PixelCard';

const CATEGORIES = ['All', 'Media', 'Documents', 'Data', 'Code', 'Tasks'];

const CATEGORY_MAP: Record<string, string> = {
  'Images': 'Media', 'Video': 'Media', 'Audio': 'Media', 'Image Generation': 'Media',
  'Text': 'Documents', 'PDF': 'Documents', 'Word': 'Documents', 'PowerPoint': 'Documents', 'Markdown': 'Documents',
  'Excel': 'Data', 'CSV': 'Data', 'JSON': 'Data', 'XML': 'Data', 'Charts': 'Data', 'Diagrams': 'Data',
  'HTML': 'Code', 'CSS': 'Code', 'JavaScript': 'Code', 'TypeScript': 'Code', 'React': 'Code', 'Next.js': 'Code', 'Node.js': 'Code', 'Python': 'Code', 'Java': 'Code', 'PHP': 'Code', 'SQL': 'Code',
  'OCR': 'Tasks', 'Translation': 'Tasks', 'Summaries': 'Tasks', 'Brainstorming': 'Tasks', 'AI Reasoning': 'Tasks', 'Coding': 'Tasks', 'Debugging': 'Tasks'
};

const capabilityIcons: Record<string, typeof Type> = {
  'Text': Type, 'Images': Image, 'Video': Video, 'Audio': AudioLines,
  'PDF': FileText, 'Word': FileText, 'Excel': FileSpreadsheet, 'PowerPoint': Presentation,
  'CSV': Table, 'JSON': Braces, 'XML': Code, 'Markdown': FileText,
  'HTML': Code, 'CSS': Palette, 'JavaScript': Code, 'TypeScript': Code,
  'React': Boxes, 'Next.js': Boxes, 'Node.js': Server, 'Python': Coffee,
  'Java': Coffee, 'PHP': Code, 'SQL': Database, 'OCR': Eye,
  'Translation': Languages, 'Summaries': FileText, 'Brainstorming': Lightbulb,
  'AI Reasoning': Brain, 'Coding': Code, 'Debugging': Bug,
  'Image Generation': Paintbrush, 'Charts': BarChart3, 'Diagrams': BarChart3,
};

export function AICapabilities() {
  const ref = useRef<HTMLDivElement>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  // Auto-switch to grid view when a filter is applied because marquee looks sparse with few items
  useEffect(() => {
    if (activeCategory !== 'All') {
      setIsGridView(true);
    }
  }, [activeCategory]);

  const filteredCapabilities = activeCategory === 'All' 
    ? AI_CAPABILITIES 
    : AI_CAPABILITIES.filter(cap => CATEGORY_MAP[cap] === activeCategory);

  // Split into 5 distinct rows for the marquee
  const chunks = [];
  const chunkSize = Math.ceil(filteredCapabilities.length / 5);
  for (let i = 0; i < filteredCapabilities.length; i += chunkSize) {
    chunks.push(filteredCapabilities.slice(i, i + chunkSize));
  }

  const CapabilityCard = ({ cap, className }: { cap: string, className?: string }) => {
    const Icon = capabilityIcons[cap] || Sparkles;
    
    return (
      <Link 
        to={`/chat?prompt=${encodeURIComponent(`I want to explore the ${cap} capability`)}`} 
        className={cn("block focus:outline-none h-[120px] w-[200px]", className)}
      >
        <PixelCard 
          variant="blue" 
          gap={5}
          speed={40}
          colors="#4f46e5,#6366f1,#818cf8,#e0e7ff"
          className="relative flex flex-col items-start p-5 bg-card/50 hover:border-[#6366f1]/50 transition-all duration-300 group overflow-hidden h-[120px] w-full cursor-pointer"
        >
          <div className="relative z-10 w-full h-full flex flex-col items-start">
            <Icon size={22} strokeWidth={1.5} className="text-muted-foreground group-hover:text-[#818cf8] transition-colors mb-auto" />
            
            <div className="mt-auto w-full pt-3 text-left">
               <span className="text-[15px] font-semibold text-foreground transition-colors block mb-1">{cap}</span>
               <span className="text-[11px] text-muted-foreground leading-snug block group-hover:text-muted-foreground transition-colors whitespace-normal">
                 Native support for {cap.toLowerCase()} processing.
               </span>
            </div>
          </div>
        </PixelCard>
      </Link>
    );
  };

  return (
    <section id="capabilities" className="py-10 md:py-16 relative overflow-hidden border-t border-white/[0.02]" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500 mb-2">
            Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-[1.1] tracking-tight mb-4">
            30+ AI capabilities
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            From text and code to images and video. M-Chat handles it all seamlessly.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                  activeCategory === cat 
                    ? "bg-indigo-500 text-foreground shadow-lg shadow-[var(--m-accent-blue)]/20" 
                    : "bg-white/5 border border-white/10 text-foreground/70 hover:bg-white/10 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
            
            <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />
            
            <button 
              onClick={() => setIsGridView(!isGridView)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-card border border-white/10 text-foreground hover:text-foreground hover:bg-white/10 transition-colors text-[12px] font-medium shadow-sm shadow-black/20"
            >
              {isGridView ? <LayoutList size={14} /> : <LayoutGrid size={14} />}
              {isGridView ? "Marquee" : "Grid"}
            </button>
          </div>
        </motion.div>
      </div>

      {isGridView ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto px-6 mt-10 flex flex-wrap justify-center gap-4"
        >
          {filteredCapabilities.map((cap, i) => (
            <motion.div
              key={cap}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.015 }}
              className="flex-[1_1_180px] max-w-[250px]"
            >
              <CapabilityCard cap={cap} className="w-full h-full" />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative w-full overflow-hidden flex flex-col gap-4 mt-8 mask-edges max-w-[100vw]"
        >
        {chunks.map((row, index) => {
          const isReverse = index % 2 !== 0;
          return (
            <div 
              key={index} 
              className={cn("flex gap-4 whitespace-nowrap min-w-max hover:[animation-play-state:paused]", isReverse ? "animate-marquee-reverse" : "animate-marquee")}
              style={{ animationDuration: '90s' }}
            >
              {[...row, ...row, ...row, ...row].map((cap, i) => (
                <CapabilityCard key={`${cap}-${index}-${i}`} cap={cap} className="flex-shrink-0" />
              ))}
            </div>
          );
        })}
        </motion.div>
      )}
    </section>
  );
}
