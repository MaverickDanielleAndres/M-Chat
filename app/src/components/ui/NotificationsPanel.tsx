import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Info, AlertCircle, Sparkles, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export type NotificationItem = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'update';
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
};

const SEED: NotificationItem[] = [
  {
    id: 'n1',
    type: 'update',
    title: 'Welcome to M-Chat',
    description: 'Sign up to sync your conversations across devices and unlock 50 daily prompts.',
    createdAt: Date.now() - 1000 * 60 * 60,
    read: false,
  },
  {
    id: 'n2',
    type: 'info',
    title: 'New feature: custom instructions',
    description: 'You can now set persistent instructions that apply to every conversation.',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    read: false,
  },
  {
    id: 'n3',
    type: 'success',
    title: 'Daily quota reset',
    description: 'Your daily prompts have been refreshed. Keep creating!',
    createdAt: Date.now() - 1000 * 60 * 60 * 49,
    read: true,
  },
];

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  update: Sparkles,
};

const COLORS = {
  info: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  update: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
};

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(SEED);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // expose to other parts of the app via a custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<NotificationItem>;
      const item: NotificationItem = {
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: (detail?.type as NotificationItem['type']) ?? 'info',
        title: detail?.title ?? 'Notification',
        description: detail?.description ?? '',
        createdAt: Date.now(),
        read: false,
      };
      setItems((prev) => [item, ...prev].slice(0, 50));
    };
    window.addEventListener('mchat:notify', handler as EventListener);
    return () => window.removeEventListener('mchat:notify', handler as EventListener);
  }, []);

  const markAllRead = () => setItems((p) => p.map((i) => ({ ...i, read: true })));
  const clearAll = () => setItems([]);
  const markRead = (id: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, read: true } : i)));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[min(92vw,360px)] rounded-xl border border-border bg-popover shadow-2xl z-[9999] overflow-hidden"
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
              <div>
                <h3 className="text-[13px] font-semibold">Notifications</h3>
                <p className="text-[11px] text-muted-foreground">
                  {unread > 0 ? `${unread} unread` : 'You are all caught up'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  disabled={unread === 0}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  title="Mark all read"
                  aria-label="Mark all read"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={clearAll}
                  disabled={items.length === 0}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  title="Clear"
                  aria-label="Clear all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-[12px] text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => {
                    const Icon = ICONS[n.type];
                    return (
                      <li
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          'flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors',
                          !n.read ? 'bg-indigo-500/[0.04]' : 'hover:bg-muted/50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border',
                            COLORS[n.type]
                          )}
                        >
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12.5px] font-medium truncate">{n.title}</p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11.5px] text-muted-foreground line-clamp-2 leading-snug">
                            {n.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Helper to push a notification from anywhere in the app. */
export function notify(title: string, description: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('mchat:notify', { detail: { title, description } })
    );
  }
}

// unused import guard
void useStore;