import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, Sparkles, MessageSquare, Code2, Image, Brain, Zap, Star } from 'lucide-react';

// Demo chat messages for the animated preview
const demoMessages = [
  { id: 1, role: 'user', text: 'Help me refactor this React component to use hooks.', delay: 0 },
  { id: 2, role: 'ai', text: "Here's a cleaner version using hooks — with proper memoization and better separation of concerns.", delay: 1200 },
  { id: 3, role: 'user', text: 'Can you add TypeScript types too?', delay: 2800 },
  { id: 4, role: 'ai', text: 'Done! I\'ve added strict TypeScript generics and proper interface definitions.', delay: 4200 },
];

const capabilities = [
  { icon: Code2, label: 'Code', tint: 'text-indigo-500' },
  { icon: Image, label: 'Vision', tint: 'text-violet-500' },
  { icon: Brain, label: 'Research', tint: 'text-emerald-500' },
  { icon: MessageSquare, label: 'Chat', tint: 'text-amber-500' },
];

const socialProof = [
  { initials: 'SC', color: '#6366f1' },
  { initials: 'MJ', color: '#a78bfa' },
  { initials: 'ER', color: '#34d399' },
  { initials: 'DK', color: '#f59e0b' },
  { initials: 'AP', color: '#f43f5e' },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot" />
    </div>
  );
}

function ChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    const run = () => {
      demoMessages.forEach((msg, idx) => {
        if (msg.role === 'user') {
          setTimeout(() => {
            setVisibleMessages((prev) => [...prev, msg.id]);
            const nextAi = demoMessages[idx + 1];
            if (nextAi && nextAi.role === 'ai') {
              setTimeout(() => setShowTyping(true), 300);
            }
          }, msg.delay);
        } else {
          setTimeout(() => {
            setShowTyping(false);
            setVisibleMessages((prev) => [...prev, msg.id]);
          }, msg.delay);
        }
      });
    };
    run();
    const total = demoMessages[demoMessages.length - 1].delay + 2500;
    const loop = setInterval(() => {
      setVisibleMessages([]);
      setShowTyping(false);
      run();
    }, total);
    return () => clearInterval(loop);
  }, []);

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl w-full h-[400px] flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 mx-6">
          <div className="px-3 py-1 rounded-md text-[10px] text-muted-foreground bg-background text-center font-mono tracking-wide">
            m-chat.ai/workspace
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] text-emerald-500 font-medium">Live</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="p-5 space-y-4 flex-1 overflow-y-auto">
        <AnimatePresence>
          {demoMessages.map((msg) =>
            visibleMessages.includes(msg.id) ? (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={11} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-sm'
                      : 'bg-muted text-foreground border border-border rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-white">U</span>
                  </div>
                )}
              </motion.div>
            ) : null
          )}

          {showTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2.5 justify-start"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                <Sparkles size={11} className="text-white" />
              </div>
              <div className="bg-muted border border-border rounded-2xl rounded-bl-sm">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="px-5 pb-5 mt-auto">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-background">
          <span className="text-[11px] text-muted-foreground flex-1">Ask anything...</span>
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <ArrowRight size={11} className="text-white" />
          </div>
        </div>
      </div>

      {/* Capability pills */}
      <div className="px-5 pb-5 flex flex-wrap gap-1.5">
        {capabilities.map(({ icon: Icon, label, tint }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background hover:border-indigo-500/40 transition-colors cursor-default"
          >
            <Icon size={10} className={tint} strokeWidth={1.5} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Ambient orbs — must be absolute to not affect flow */}
      <div className="absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-[400px] h-[400px] rounded-full bg-violet-500/20 blur-[100px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-amber-500/20 blur-[80px] opacity-30 pointer-events-none" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-20 pt-24 pb-10 md:pt-28 md:pb-16">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-w-0"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium mb-5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-500">
              <Zap size={11} strokeWidth={2} />
              <span>Powered by Qwen AI · Free to start</span>
            </div>

            <div className="mb-2 overflow-hidden">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground leading-[1.05] tracking-tight">
                The AI workspace
                <br />
                that{' '}
                <span className="gradient-text">thinks</span>
                <br />
                <span className="text-muted-foreground">with you.</span>
              </h1>
            </div>

            <p className="mt-4 text-[15px] md:text-[16px] text-muted-foreground max-w-xl leading-relaxed">
              Chat, code, analyze images, read documents, and research — all in one
              conversation. No switching tabs. No wasted context.
            </p>

            <div className="flex flex-wrap gap-3 mt-8 mb-8">
              <Link
                to="/chat"
                className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Start for free
                <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-medium border border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/40 hover:bg-muted transition-all duration-200"
              >
                See how it works
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {socialProof.map(({ initials, color }) => (
                  <div
                    key={initials}
                    className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11} className="text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  <span className="text-foreground font-semibold">5,000+</span> creators & developers
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right — Animated Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative hidden lg:block min-w-0"
          >
            {/* Glow behind demo */}
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 blur-3xl scale-90 pointer-events-none" />

            <div className="relative">
              <ChatDemo />
            </div>

            {/* Floating stat cards — positioned relative to the right column so they don't overflow the page */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -left-6 hidden xl:flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-lg z-10"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Brain size={15} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground">30+ Capabilities</p>
                <p className="text-[10px] text-muted-foreground">Code · Vision · Voice</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="absolute -bottom-4 -right-6 hidden xl:flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-lg z-10"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Zap size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground">20 Free/day</p>
                <p className="text-[10px] text-muted-foreground">No card needed</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-center"
        >
          {[
            { value: '30+', label: 'AI Capabilities' },
            { value: '20', label: 'Free prompts / day' },
            { value: '100+', label: 'Languages supported' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-display font-bold text-foreground mb-1">{value}</div>
              <div className="text-[12px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}