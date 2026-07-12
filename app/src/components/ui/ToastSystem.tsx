import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Toast } from '@/types';

const config: Record<string, { icon: typeof CheckCircle; className: string }> = {
  success: { icon: CheckCircle, className: 'text-[var(--m-accent-green)] bg-[var(--m-accent-green)]/10 border-[var(--m-accent-green)]/15' },
  warning: { icon: AlertTriangle, className: 'text-amber-400 bg-amber-400/10 border-amber-400/15' },
  error: { icon: XCircle, className: 'text-[var(--m-accent-red)] bg-[var(--m-accent-red)]/10 border-[var(--m-accent-red)]/15' },
  info: { icon: Info, className: 'text-[var(--m-accent-blue)] bg-[var(--m-accent-blue)]/10 border-[var(--m-accent-blue)]/15' },
};

export function ToastSystem() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { icon: Icon, className } = config[toast.type] || config.info;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div layout initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm ${className}`}>
      <Icon size={16} strokeWidth={1.5} className="flex-shrink-0 mt-0.5" />
      <p className="text-[13px] flex-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="flex-shrink-0 p-0.5 rounded hover:bg-white/5 transition-colors">
        <X size={12} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}
