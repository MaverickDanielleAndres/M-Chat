import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';

export function ForgotPasswordPage() {
  const { resetPassword } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccess('Password reset link sent! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050507]">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logonobg.png" alt="M-Chat Logo" className="w-9 h-9" />
            <span className="font-semibold text-lg text-[var(--m-text-primary)]">M-Chat</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[var(--m-bg-elevated)] p-8">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={18} className="text-[var(--m-accent-blue)]" strokeWidth={1.5} />
            <h1 className="text-xl font-semibold text-[var(--m-text-primary)]">Reset password</h1>
          </div>
          <p className="text-[13px] text-[var(--m-text-muted)] mb-6">Enter your email and we&apos;ll send you a reset link.</p>

          {error && <div className="mb-4 p-3 rounded-xl text-[13px] text-[var(--m-accent-red)] bg-red-500/5 border border-red-500/10">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-xl text-[13px] text-[var(--m-accent-green)] bg-green-500/5 border border-green-500/10">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--m-text-secondary)] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)]" strokeWidth={1.5} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] border border-white/[0.06] bg-white/[0.02] text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] outline-none focus:border-[var(--m-accent-blue)]/30 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className={cn('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium', 'bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90', 'disabled:opacity-50')}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-[12px] text-[var(--m-accent-blue)] hover:underline">
            <ArrowLeft size={13} strokeWidth={1.5} /> Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
