import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';

export function ResetPasswordPage() {
  const { updatePassword } = useSupabaseAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) { setError(err.message || 'Failed to reset'); }
    finally { setIsLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050507]">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-white/[0.06] bg-[var(--m-bg-elevated)] p-8">
          <CheckCircle size={40} className="mx-auto mb-4 text-[var(--m-accent-green)]" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold text-[var(--m-text-primary)] mb-2">Password updated</h1>
          <p className="text-[13px] text-[var(--m-text-muted)] mb-6">Your password has been successfully reset.</p>
          <Link to="/login" className={cn('inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-medium', 'bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90')}>
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );

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
          <h1 className="text-xl font-semibold text-[var(--m-text-primary)] mb-1">New password</h1>
          <p className="text-[13px] text-[var(--m-text-muted)] mb-6">Create a new password for your account.</p>

          {error && <div className="mb-4 p-3 rounded-xl text-[13px] text-[var(--m-accent-red)] bg-red-500/5 border border-red-500/10">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--m-text-secondary)] mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)]" strokeWidth={1.5} />
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[13px] border border-white/[0.06] bg-white/[0.02] text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] outline-none focus:border-[var(--m-accent-blue)]/30 transition-colors" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)]">
                  {show ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--m-text-secondary)] mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)]" strokeWidth={1.5} />
                <input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm" required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] border border-white/[0.06] bg-white/[0.02] text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] outline-none focus:border-[var(--m-accent-blue)]/30 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className={cn('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium', 'bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90', 'disabled:opacity-50')}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
