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

/**
 * Tailored starter prompts per capability. Each one is concrete enough that
 * the model can demonstrate the feature on the very first response, so the
 * user lands in the chat with something working — not a generic greeting.
 */
const STARTER_PROMPTS: Record<string, string> = {
  'Text': 'Write a friendly welcome paragraph for a new M-Chat user in 3 sentences.',
  'Images': 'Describe how image understanding works and what kinds of images you can analyze (charts, screenshots, photos, diagrams).',
  'Video': 'Explain how you analyze video content frame by frame and what insights you can extract.',
  'Audio': 'Describe how voice conversations work: speech-to-text input, text-to-speech responses, and the languages you support.',
  'PDF': 'I will upload a PDF in my next message. Summarize its key points in 5 bullets once I do.',
  'Word': 'I will upload a .docx file next. Extract its headings and the first paragraph of each section.',
  'Excel': 'I will upload an .xlsx file next. Show me how to detect outliers and trends in the first numeric column.',
  'PowerPoint': 'Outline a 6-slide deck on "Building a startup in 2026" — slide title + 3 bullets per slide.',
  'CSV': 'I will upload a CSV next. Show me how to group rows by a chosen column and compute averages per group.',
  'JSON': 'Convert this JSON array of products into a markdown table with columns name, price, stock:\n\n```json\n[{"name":"Pen","price":1.5,"stock":120},{"name":"Notebook","price":3.2,"stock":40}]\n```',
  'XML': 'Show how to parse this XML and extract every <item> title:\n\n```xml\n<catalog><item><title>Book A</title></item><item><title>Book B</title></item></catalog>\n```',
  'Markdown': 'Render this Markdown to a preview and explain its structure:\n\n# Heading\n- bullet 1\n- bullet 2\n\n```js\nconsole.log("hi")\n```',
  'HTML': 'Build a responsive hero section using semantic HTML + Tailwind: a headline, a subhead, and a CTA button.',
  'CSS': 'Write CSS for a glassmorphism card: blurred background, soft border, subtle shadow. No frameworks.',
  'JavaScript': 'Write a debounce(fn, wait) helper in JavaScript with TypeScript types and a one-line usage example.',
  'TypeScript': 'Type this function so the return type is inferred from a generic argument, then write a usage example.',
  'React': 'Create a React + TypeScript component called <Counter /> with + and − buttons and a number display.',
  'Next.js': 'Show me a Next.js 14 app-router server component that fetches data and renders a list.',
  'Node.js': 'Write a minimal Express endpoint that returns JSON { ok: true } and listens on PORT (env or 3000).',
  'Python': 'Write a Python script that reads a CSV with pandas and prints the top 5 rows plus column dtypes.',
  'Java': 'Write a Java class that validates an email address with a static method returning boolean.',
  'PHP': 'Write a PHP function that safely escapes HTML and one that reads a query string parameter.',
  'SQL': 'Write a SQL query that returns the top 3 customers by total order amount from `orders` and `customers` tables.',
  'OCR': 'I will upload an image of a receipt next. Extract each line item and the total into a structured table.',
  'Translation': 'Translate this to Spanish, French, and Japanese:\n\n"Welcome to M-Chat. Let\'s get you started in seconds."',
  'Summaries': 'Summarize the following passage in 3 bullet points (60 words max):\n\nThe Apollo program was a series of NASA missions in the 1960s and 1970s that landed humans on the Moon...',
  'Brainstorming': 'Brainstorm 10 product names for an AI workspace that combines chat, code, and document analysis.',
  'AI Reasoning': 'Solve step by step: A train leaves city A at 9am traveling 60 km/h. Another leaves city B (300 km away) at 10am toward A at 90 km/h. When do they meet?',
  'Coding': 'Review this snippet and point out bugs and improvements:\n\n```js\nfunction add(a,b){return a+b}\nconsole.log(add(1,"2"))\n```',
  'Debugging': 'Help me debug this error:\n\nTypeError: Cannot read properties of undefined (reading "map")\n  at UserList (UserList.tsx:12)',
  'Image Generation': 'Generate an image of a serene mountain cabin at sunrise with mist over a glassy lake.',
  'Charts': 'Recommend 3 chart types for visualizing monthly revenue per product category, and explain trade-offs.',
  'Diagrams': 'Describe the architecture of a typical chat app as a diagram in Mermaid syntax (frontend → API → DB).',
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
    const starterPrompt = STARTER_PROMPTS[cap] ?? `Show me what you can do with ${cap}.`;
    return (
      <Link
        to={`/chat?prompt=${encodeURIComponent(starterPrompt)}`}
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
