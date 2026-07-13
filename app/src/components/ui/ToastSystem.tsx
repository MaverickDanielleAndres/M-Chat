import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Toast } from '@/types';
import { cn } from '@/lib/utils';

const config: Record<string, { icon: typeof CheckCircle; className: string }> = {
  success: {
    icon: CheckCircle,
    className:
      'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  error: {
    icon: XCircle,
    className: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30',
  },
  info: {
    icon: Info,
    className:
      'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  },
};

export function ToastSystem() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const cfg = config[toast.type] || config.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-3.5 py-3 rounded-xl border shadow-lg backdrop-blur-sm bg-card/95',
        cfg.className
      )}
    >
      <Icon size={16} className="flex-shrink-0" />
      <p className="text-[13px] leading-snug flex-1 text-foreground">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}