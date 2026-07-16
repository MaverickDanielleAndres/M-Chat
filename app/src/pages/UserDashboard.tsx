import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { User, Settings, CreditCard, LogOut, MessageSquare, Zap, Crown, Shield, ChevronRight, Loader2, Save, Moon, Sun, Monitor, Calendar } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/types';

type Tab = 'overview' | 'settings' | 'billing';

const tierColors: Record<string, string> = { free: 'var(--m-text-muted)', registered: 'var(--m-accent-blue)', pro: 'var(--m-accent-green)', premium: 'var(--m-accent-red)' };

export function UserDashboard() {
  const { user, profile, signOut, updateProfile, isLoading: authLoading } = useSupabaseAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('system');

  useEffect(() => { if (profile?.display_name) setDisplayName(profile.display_name); }, [profile]);

  const handleSave = async () => { setSaving(true); await updateProfile({ display_name: displayName }); setSaving(false); };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: User },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <Loader2 size={20} className="animate-spin text-[var(--m-text-muted)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507]">
      <div className="border-b border-white/[0.04] bg-[var(--m-bg-elevated)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logonobg.png" alt="M-Chat Logo" className="w-6 h-6" />
              <span className="text-[13px] font-medium text-[var(--m-text-primary)]">M-Chat</span>
            </Link>
            <span className="text-[var(--m-text-muted)]">/</span>
            <span className="text-[13px] text-[var(--m-text-primary)]">Dashboard</span>
          </div>
          <Link to="/chat" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90 transition-opacity">
            <MessageSquare size={12} strokeWidth={1.5} />Chat
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-56 flex-shrink-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--m-accent-blue-soft)] flex items-center justify-center text-[var(--m-accent-blue)] text-sm font-medium">
                {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--m-text-primary)]">{profile?.display_name || user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[11px] text-[var(--m-text-muted)]">{user?.email}</p>
              </div>
            </div>
            <nav className="space-y-0.5">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-colors', tab === t.id ? 'font-medium bg-white/[0.04] text-[var(--m-text-primary)]' : 'text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.02]')}>
                  <t.icon size={15} strokeWidth={1.5} />{t.label}
                </button>
              ))}
              <div className="border-t border-white/[0.04] pt-1.5 mt-1.5">
                <button onClick={() => signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[var(--m-accent-red)]/80 hover:bg-[var(--m-accent-red)]/5 transition-colors">
                  <LogOut size={15} strokeWidth={1.5} />Sign Out
                </button>
              </div>
            </nav>
          </div>

          <div className="flex-1">
            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Tier', value: (profile?.subscription_tier || 'free'), icon: Crown, color: tierColors[profile?.subscription_tier || 'free'] },
                    { label: 'Role', value: profile?.role || 'user', icon: User, color: 'var(--m-accent-blue)' },
                    { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—', icon: Calendar, color: 'var(--m-accent-green)' },
                  ].map((s) => (
                    <div key={s.label} className="p-4 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                      <div className="flex items-center gap-2 mb-2">
                        <s.icon size={14} strokeWidth={1.5} style={{ color: s.color }} />
                        <span className="text-[11px] text-[var(--m-text-muted)]">{s.label}</span>
                      </div>
                      <p className="text-lg font-semibold text-[var(--m-text-primary)] capitalize">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)]">Current Plan</h3>
                      <p className="text-[13px] capitalize" style={{ color: tierColors[profile?.subscription_tier || 'free'] }}>{(profile?.subscription_tier || 'free')}</p>
                    </div>
                    <Crown size={20} strokeWidth={1.5} style={{ color: tierColors[profile?.subscription_tier || 'free'] }} />
                  </div>
                  {profile?.subscription_tier === 'free' && (
                    <Link to="/upgrade" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium bg-[var(--m-accent-blue)] text-white hover:opacity-90 transition-opacity">
                      <Zap size={12} strokeWidth={1.5} /> Upgrade
                    </Link>
                  )}
                </div>

                {profile?.role && profile.role !== 'user' && (
                  <div className="p-4 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)] flex items-center gap-3">
                    <Shield size={18} strokeWidth={1.5} className="text-[var(--m-accent-blue)]" />
                    <div>
                      <p className="text-[13px] font-medium text-[var(--m-text-primary)] capitalize">{profile.role} Account</p>
                      <p className="text-[11px] text-[var(--m-text-muted)]">Extended access</p>
                    </div>
                    {profile.role === 'admin' && (
                      <Link to="/admin" className="ml-auto text-[12px] font-medium text-[var(--m-accent-blue)] flex items-center gap-0.5">Admin <ChevronRight size={12} strokeWidth={1.5} /></Link>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                  <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)] mb-4">Profile</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[var(--m-text-secondary)] mb-1.5">Display Name</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-[13px] border border-white/[0.06] bg-white/[0.02] text-[var(--m-text-primary)] outline-none focus:border-[var(--m-accent-blue)]/20 transition-colors" />
                    </div>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90 disabled:opacity-50 transition-opacity">
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} strokeWidth={1.5} />} Save
                    </button>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                  <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)] mb-4">Appearance</h3>
                  <div className="flex p-0.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    {([['light', Sun], ['dark', Moon], ['system', Monitor]] as [ThemeMode, typeof Sun][]).map(([mode, Icon]) => (
                      <button key={mode} onClick={() => setTheme(mode)}
                        className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] transition-all', theme === mode ? 'bg-white/[0.06] text-[var(--m-text-primary)] shadow-sm' : 'text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)]')}>
                        <Icon size={13} strokeWidth={1.5} /><span className="capitalize">{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'billing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                  <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)] mb-2">Billing</h3>
                  <p className="text-[13px] text-[var(--m-text-muted)]">Subscription billing coming soon with Stripe, PayPal, and local payment providers.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
