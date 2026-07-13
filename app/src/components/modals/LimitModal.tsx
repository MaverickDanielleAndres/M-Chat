import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router';

export function LimitModal() {
  const { limitModalOpen, toggleLimitModal, wallet } = useStore();
  const navigate = useNavigate();

  if (!limitModalOpen) return null;

  const unlimited = wallet.daily_quota === -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={toggleLimitModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          data-dialog
        >
          <div className="mesh-gradient absolute inset-0 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between p-5 pb-2">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" /> Upgrade to keep going
              </h2>
              <button
                onClick={toggleLimitModal}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-3">
              <p className="text-[13px] leading-relaxed mb-2 text-foreground">
                {unlimited
                  ? "You've used all the credits in your wallet."
                  : `You've used all ${wallet.daily_quota} daily prompts.`}
              </p>
              <p className="text-[13px] text-muted-foreground mb-5">
                Upgrade to Pro for unlimited prompts, longer context, image generation, voice, and more.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    toggleLimitModal();
                    navigate('/upgrade');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:opacity-90 transition-opacity shadow-sm shadow-indigo-500/30"
                >
                  See plans & upgrade <ArrowRight size={14} />
                </button>
                <button
                  onClick={toggleLimitModal}
                  className="w-full py-2.5 rounded-lg text-[13px] font-medium border border-border hover:bg-muted transition-colors text-foreground"
                >
                  Maybe later
                </button>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border text-center bg-muted/30">
              <p className="text-[11px] text-muted-foreground">
                Cancel anytime · 7-day money-back guarantee
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}