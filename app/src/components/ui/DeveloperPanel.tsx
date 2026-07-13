import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, X, Activity, Cpu, Clock, Hash, Database, Zap, Wallet } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function DeveloperPanel() {
  const { settings, conversations, activeConversationId, wallet, aiStatus } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!settings.developerMode) return;
    const interval = setInterval(() => {
      const mem = (performance as any).memory
        ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
        : 0;
      const conv = conversations.find((c) => c.id === activeConversationId);
      const tokens = conv?.messages.reduce((a, m) => a + Math.ceil(m.content.length / 4), 0) || 0;
      console.log('[dev]', {
        status: aiStatus,
        tokens,
        msgs: conv?.messages.length || 0,
        wallet: wallet.balance,
        mem: `${mem}MB`,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [settings.developerMode, conversations, activeConversationId, wallet.balance, aiStatus]);

  if (!settings.developerMode) return null;

  const conv = conversations.find((c) => c.id === activeConversationId);
  const tokens = conv?.messages.reduce((a, m) => a + Math.ceil(m.content.length / 4), 0) || 0;
  const mem = (performance as any).memory
    ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
    : 0;

  const stats = [
    { icon: Activity, label: 'Status', value: aiStatus },
    { icon: Cpu, label: 'Model', value: 'gemini-2.0-flash' },
    { icon: Wallet, label: 'Credits', value: wallet.balance },
    { icon: Hash, label: 'Tokens', value: tokens },
    { icon: Database, label: 'Messages', value: conv?.messages.length || 0 },
    { icon: Zap, label: 'Daily', value: `${wallet.daily_used}/${wallet.daily_quota}` },
    { icon: Clock, label: 'Memory', value: `${mem} MB` },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 transition-colors"
        title="Developer panel"
      >
        <Code2 size={16} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-16 right-4 z-50 w-64 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <span className="text-[12px] font-medium flex items-center gap-2">
                <Cpu size={13} strokeWidth={1.5} className="text-indigo-400" /> Dev Mode
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-4 space-y-2.5">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <s.icon size={11} strokeWidth={1.5} />
                    {s.label}
                  </div>
                  <span className="text-[11px] font-mono capitalize">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}