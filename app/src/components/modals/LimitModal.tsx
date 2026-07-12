import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function LimitModal() {
  const { limitModalOpen, toggleLimitModal } = useStore();
  const portfolioUrl = import.meta.env.VITE_PORTFOLIO_URL || '#';
  const contactUrl = import.meta.env.VITE_CONTACT_URL || '#';

  if (!limitModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={toggleLimitModal}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[var(--m-bg-elevated)] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()} data-dialog>

          <div className="mesh-gradient absolute inset-0 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-lg font-semibold text-[var(--m-text-primary)]">Limit Reached</h2>
              <button onClick={toggleLimitModal} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-[var(--m-text-muted)] transition-colors">
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-[13px] text-[var(--m-text-primary)] leading-relaxed mb-4">
                You&apos;ve used all 20 free AI requests. Your conversations are still saved.
              </p>
              <p className="text-[13px] text-[var(--m-text-muted)] mb-6">
                Need unlimited access? Get in touch.
              </p>

              <div className="space-y-2">
                <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90 transition-opacity">
                  <ExternalLink size={14} strokeWidth={1.5} /> View Portfolio
                </a>
                <a href={contactUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border border-white/[0.08] text-[var(--m-text-secondary)] hover:text-[var(--m-text-primary)] hover:border-white/[0.12] transition-all">
                  <Mail size={14} strokeWidth={1.5} /> Contact Developer
                </a>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.04] text-center bg-white/[0.01]">
              <p className="text-[11px] text-[var(--m-text-muted)]">
                Built by <span className="text-[var(--m-text-secondary)] font-medium">Maverick Danielle Andres</span>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
