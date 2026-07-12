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
  { icon: Code2, label: 'Code', color: 'var(--m-accent-blue)' },
  { icon: Image, label: 'Vision', color: '#a78bfa' },
  { icon: Brain, label: 'Research', color: '#34d399' },
  { icon: MessageSquare, label: 'Chat', color: 'var(--m-accent-amber)' },
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
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--m-accent-blue)] typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--m-accent-blue)] typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--m-accent-blue)] typing-dot" />
    </div>
  );
}

function ChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {

    demoMessages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg.id]);
          // show typing for next AI message
          const nextAi = demoMessages[idx + 1];
          if (nextAi && nextAi.role === 'ai') {
            setTimeout(() => {
              setShowTyping(true);
            }, 300);
          }
        }, msg.delay);
      } else {
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages(prev => [...prev, msg.id]);
        }, msg.delay);
      }
    });

    // Loop restart
    const total = demoMessages[demoMessages.length - 1].delay + 2500;
    const loop = setInterval(() => {
      setVisibleMessages([]);
      setShowTyping(false);
      demoMessages.forEach((msg, idx) => {
        if (msg.role === 'user') {
          setTimeout(() => {
            setVisibleMessages(prev => [...prev, msg.id]);
            const nextAi = demoMessages[idx + 1];
            if (nextAi && nextAi.role === 'ai') {
              setTimeout(() => { setShowTyping(true); }, 300);
            }
          }, msg.delay);
        } else {
          setTimeout(() => {
            setShowTyping(false);
            setVisibleMessages(prev => [...prev, msg.id]);
          }, msg.delay);
        }
      });
    }, total);

    return () => clearInterval(loop);
  }, []);

  return (
    <div className="relative rounded-2xl border border-white/[0.07] bg-[#0a0a10] overflow-hidden shadow-2xl w-full h-[400px] flex flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-[#080810]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-6">
          <div className="px-3 py-1 rounded-md text-[10px] text-white/20 bg-white/[0.03] text-center font-mono tracking-wide">
            m-chat.ai/workspace
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--m-accent-green)] animate-pulse" />
          <span className="text-[9px] text-[var(--m-accent-green)] font-medium">Live</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="p-5 space-y-4 flex-1">
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
                  <div className="w-6 h-6 rounded-full bg-[var(--m-accent-blue)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={11} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--m-accent-blue)] text-white rounded-br-sm'
                      : 'bg-white/[0.05] text-white/80 border border-white/[0.05] rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-[var(--m-accent-amber)] flex items-center justify-center flex-shrink-0 mt-0.5">
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
              <div className="w-6 h-6 rounded-full bg-[var(--m-accent-blue)] flex items-center justify-center flex-shrink-0">
                <Sparkles size={11} className="text-white" />
              </div>
              <div className="bg-white/[0.05] border border-white/[0.05] rounded-2xl rounded-bl-sm">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="px-5 pb-5 mt-auto">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <span className="text-[11px] text-white/20 flex-1">Ask anything...</span>
          <div className="w-6 h-6 rounded-full bg-[var(--m-accent-blue)] flex items-center justify-center">
            <ArrowRight size={11} className="text-white" />
          </div>
        </div>
      </div>

      {/* Capability pills */}
      <div className="px-5 pb-5 flex flex-wrap gap-1.5">
        {capabilities.map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] transition-colors cursor-default"
          >
            <Icon size={10} style={{ color }} strokeWidth={1.5} />
            <span className="text-[10px] text-white/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden noise-overlay" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      {/* Ambient orbs */}
      <div className="orb-indigo w-[600px] h-[600px] -top-40 -left-32 opacity-60" />
      <div className="orb-violet w-[400px] h-[400px] top-1/2 -translate-y-1/2 right-0 opacity-40" />
      <div className="orb-amber w-[300px] h-[300px] bottom-0 left-1/3 opacity-30" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-10 md:pt-28 md:pb-16 w-full">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 xl:gap-16 items-center">

          {/* Left — Copy */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium mb-5 border border-[var(--m-accent-blue)]/20 bg-[var(--m-accent-blue)]/8 text-[var(--m-accent-blue)]"
            >
              <Zap size={11} strokeWidth={2} />
              <span>Powered by Qwen AI · Free to start</span>
            </motion.div>

            {/* Headline */}
            <div className="mb-2 overflow-hidden">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-display font-bold text-[var(--m-text-primary)] leading-[1.05] tracking-tight"
              >
                The AI workspace
                <br />
                that{' '}
                <span className="gradient-text">thinks</span>
                <br />
                <span className="text-[var(--m-text-secondary)]">with you.</span>
              </motion.h1>
            </div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="mt-2 text-[15px] md:text-[16px] text-[var(--m-text-secondary)] max-w-xl leading-relaxed"
            >
              Chat, code, analyze images, read documents, and research — all in one
              conversation. No switching tabs. No wasted context.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="flex flex-wrap gap-3 mt-8 mb-8"
            >
              <Link
                to="/chat"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-[14px] font-semibold bg-[var(--m-accent-blue)] text-white hover:bg-[#4f52e0] transition-all duration-200 shadow-lg shadow-[var(--m-accent-blue)]/25 hover:shadow-[var(--m-accent-blue)]/40 hover:-translate-y-0.5"
              >
                Start for free
                <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[14px] font-medium border border-white/[0.08] text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] hover:border-white/[0.14] hover:bg-white/[0.03] transition-all duration-200"
              >
                See how it works
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.48 }}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-2.5">
                {socialProof.map(({ initials, color }) => (
                  <div
                    key={initials}
                    className="w-8 h-8 rounded-full border-2 border-[var(--m-bg-base)] flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11} className="text-[var(--m-accent-amber)] fill-[var(--m-accent-amber)]" />
                  ))}
                </div>
                <p className="text-[12px] text-[var(--m-text-muted)]">
                  <span className="text-[var(--m-text-secondary)] font-semibold">5,000+</span> creators & developers
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right — Animated Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative hidden lg:block"
          >
            {/* Glow behind demo */}
            <div className="absolute inset-0 rounded-3xl bg-[var(--m-accent-blue)]/10 blur-3xl scale-90" />
            <div className="relative">
              <ChatDemo />
            </div>

            {/* Floating stat cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-10 top-1/4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl shadow-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--m-accent-green)]/15 flex items-center justify-center">
                <Brain size={15} className="text-[var(--m-accent-green)]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[var(--m-text-primary)]">30+ Capabilities</p>
                <p className="text-[10px] text-[var(--m-text-muted)]">Code · Vision · Voice</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="absolute -right-8 bottom-1/3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl shadow-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--m-accent-amber)]/15 flex items-center justify-center">
                <Zap size={15} className="text-[var(--m-accent-amber)]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[var(--m-text-primary)]">20 Free/day</p>
                <p className="text-[10px] text-[var(--m-text-muted)]">No card needed</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-center"
        >
          {[
            { value: '30+', label: 'AI Capabilities' },
            { value: '20', label: 'Free prompts / day' },
            { value: '100+', label: 'Languages supported' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-display font-bold text-[var(--m-text-primary)] mb-1">{value}</div>
              <div className="text-[12px] text-[var(--m-text-muted)]">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
