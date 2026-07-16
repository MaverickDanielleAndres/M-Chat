import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Coins, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { IconButton } from '@/components/ui/IconButton';


interface UserData {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  subscription_tier: string;
  created_at: string;
}

interface WalletData {
  balance: number;
  daily_quota: number;
  daily_used: number;
  lifetime_granted: number;
}

interface Props {
  user: UserData | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function UserManagementModal({ user, onClose, onUpdated }: Props) {
  const { addToast } = useStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState('');
  const [tier, setTier] = useState('');
  const [grantAmount, setGrantAmount] = useState('0');

  useEffect(() => {
    if (!user) return;
    setRole(user.role);
    setTier(user.subscription_tier);
    
    const fetchWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('credit_wallets')
          .select('balance, daily_quota, daily_used, lifetime_granted')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        setWallet(data);
      } catch (err) {
        console.warn('Failed to load wallet:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update Profile (Role & Tier)
      if (role !== user.role || tier !== user.subscription_tier) {
        const { error: profileErr } = await supabase
          .from('user_profiles')
          .update({ role, subscription_tier: tier })
          .eq('id', user.id);
        if (profileErr) throw profileErr;
      }

      // 2. Grant Credits if requested
      const amount = parseInt(grantAmount, 10);
      if (amount && amount !== 0) {
        const { error: grantErr } = await supabase.rpc('admin_grant_credits', {
          p_user_id: user.id,
          p_amount: amount,
          p_description: 'Admin granted credits',
        });
        if (grantErr) throw grantErr;
      }

      addToast({ type: 'success', message: 'User updated successfully' });
      onUpdated();
      onClose();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update user' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-[var(--m-bg-elevated)] border border-white/[0.04] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--m-accent-blue-soft)] flex items-center justify-center text-[var(--m-accent-blue)] font-medium text-xs">
                {(user.display_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--m-text-primary)] leading-tight">
                  {user.display_name || 'Unnamed User'}
                </h3>
                <p className="text-[10px] text-[var(--m-text-muted)] truncate max-w-[200px]">
                  {user.email || user.id}
                </p>
              </div>
            </div>
            <IconButton size="xs" variant="subtle" onClick={onClose} aria-label="Close">
              <X size={16} />
            </IconButton>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[var(--m-text-muted)]" />
              </div>
            ) : (
              <>
                {/* Profile Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--m-text-primary)] font-medium text-sm mb-1">
                    <Shield size={14} className="text-[var(--m-accent-red)]" /> Access & Role
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] text-[var(--m-text-muted)]">User Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2 text-[13px] text-[var(--m-text-primary)] outline-none focus:border-[var(--m-accent-blue)] transition-colors appearance-none"
                    >
                      <option value="guest">Guest</option>
                      <option value="user">User</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[var(--m-text-muted)]">Subscription Tier</label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2 text-[13px] text-[var(--m-text-primary)] outline-none focus:border-[var(--m-accent-blue)] transition-colors appearance-none"
                    >
                      <option value="free">Free</option>
                      <option value="registered">Registered</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                <hr className="border-white/[0.04]" />

                {/* Credits Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--m-text-primary)] font-medium text-sm mb-1">
                    <Coins size={14} className="text-[var(--m-accent-green)]" /> Credit Wallet
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                      <p className="text-[10px] text-[var(--m-text-muted)] mb-1">Current Balance</p>
                      <p className="text-xl font-semibold text-[var(--m-text-primary)]">{wallet?.balance ?? 0}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                      <p className="text-[10px] text-[var(--m-text-muted)] mb-1">Daily Usage</p>
                      <p className="text-xl font-semibold text-[var(--m-text-primary)]">
                        {wallet?.daily_used ?? 0}
                        <span className="text-[11px] text-[var(--m-text-muted)] ml-1 font-normal">
                          / {wallet?.daily_quota === -1 ? '∞' : wallet?.daily_quota}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[var(--m-text-muted)]">Grant / Deduct Credits</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2 text-[13px] text-[var(--m-text-primary)] outline-none focus:border-[var(--m-accent-blue)] transition-colors"
                        placeholder="e.g. 500 or -500"
                      />
                    </div>
                    <p className="text-[9px] text-[var(--m-text-muted)]">Use negative numbers to deduct credits.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-end gap-3 flex-shrink-0 bg-white/[0.01]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-medium text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium bg-[var(--m-accent-blue)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
