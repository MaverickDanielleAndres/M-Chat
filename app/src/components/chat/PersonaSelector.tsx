import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Code2, PenTool, Database, Languages, Brain, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export const PERSONAS = [
  {
    id: 'default',
    name: 'General Assistant',
    icon: Brain,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    prompt: '',
  },
  {
    id: 'coder',
    name: 'Senior Developer',
    icon: Code2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    prompt: 'You are a Senior Software Engineer. You write clean, efficient, and well-documented code. Always consider performance, security, and best practices. Provide brief explanations before code blocks.',
  },
  {
    id: 'copywriter',
    name: 'Copywriter',
    icon: PenTool,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    prompt: 'You are an expert Copywriter and Marketing Strategist. Write engaging, persuasive, and clear copy. Tailor your tone to the target audience and focus on driving action and delivering value.',
  },
  {
    id: 'data',
    name: 'Data Analyst',
    icon: Database,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    prompt: 'You are a Senior Data Analyst. Focus on finding insights, identifying trends, and explaining complex statistics simply. Provide SQL, Python, or Excel formulas when applicable.',
  },
  {
    id: 'translator',
    name: 'Translator',
    icon: Languages,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    prompt: 'You are an expert Translator. Translate the following text naturally and accurately, preserving the original tone and nuances. If there are multiple ways to translate a phrase, provide the most native-sounding option and briefly explain why.',
  },
];

export function PersonaSelector() {
  const { activeConversationId, conversations, updateConversation } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === activeConversationId);
  const currentPersona = PERSONAS.find(p => p.prompt === conversation?.system_prompt) || PERSONAS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!conversation) return null;

  const handleSelect = (persona: typeof PERSONAS[0]) => {
    updateConversation(conversation.id, { system_prompt: persona.prompt });
    setIsOpen(false);
  };

  const Icon = currentPersona.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-[11px] font-medium transition-colors flex-shrink-0"
        aria-label={`Persona: ${currentPersona.name}`}
        title={currentPersona.name}
      >
        <Icon size={12} className={currentPersona.color} />
        <span className="text-foreground/80 hidden sm:inline">{currentPersona.name}</span>
        <ChevronDown size={12} className="text-muted-foreground ml-0.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1.5 w-56 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="p-2 space-y-0.5">
              <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Select Persona
              </div>
              {PERSONAS.map((p) => {
                const PIcon = p.icon;
                const isActive = p.id === currentPersona.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[12px] transition-colors',
                      isActive ? 'bg-muted text-foreground font-medium' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0', p.bg)}>
                      <PIcon size={12} className={p.color} />
                    </div>
                    <span className="flex-1 truncate">{p.name}</span>
                    {isActive && <Sparkles size={12} className="text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
