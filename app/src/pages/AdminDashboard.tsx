import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Shield, Users, MessageSquare, TrendingUp, Activity, Settings, BarChart3, ArrowLeft, Loader2, Crown, Zap, HardDrive, Eye } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'users' | 'analytics' | 'settings';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { role, isLoading, signOut } = useSupabaseAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ totalUsers: 0, totalChats: 0, totalMessages: 0, proUsers: 0, premiumUsers: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isLoading && role !== 'admin') navigate('/dashboard'); }, [isLoading, role, navigate]);

  useEffect(() => {
    if (role !== 'admin') return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { count: tu } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        const { count: pu } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro');
        const { count: pru } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'premium');
        const { count: tc } = await supabase.from('chats').select('*', { count: 'exact', head: true });
        const { count: tm } = await supabase.from('chat_messages').select('*', { count: 'exact', head: true });
        const { data: ud } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(50);
        setStats({ totalUsers: tu || 0, totalChats: tc || 0, totalMessages: tm || 0, proUsers: pu || 0, premiumUsers: pru || 0 });
        if (ud) setUsers(ud);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [role]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#050507]"><Loader2 size={20} className="animate-spin text-[var(--m-text-muted)]" /></div>;
  if (role !== 'admin') return null;

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'analytics' as Tab, label: 'Analytics', icon: Activity },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  const statCards = [
    { label: 'Users', value: stats.totalUsers, icon: Users, color: 'var(--m-accent-blue)' },
    { label: 'Chats', value: stats.totalChats, icon: MessageSquare, color: 'var(--m-accent-green)' },
    { label: 'Messages', value: stats.totalMessages, icon: HardDrive, color: 'var(--m-accent-blue)' },
    { label: 'Pro', value: stats.proUsers, icon: Crown, color: 'var(--m-accent-green)' },
    { label: 'Premium', value: stats.premiumUsers, icon: Zap, color: 'var(--m-accent-red)' },
  ];

  return (
    <div className="min-h-screen bg-[#050507]">
      <div className="border-b border-white/[0.04] bg-[var(--m-bg-elevated)]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logonobg.png" alt="M-Chat Logo" className="w-6 h-6" />
              <span className="text-[13px] font-medium text-[var(--m-text-primary)]">M-Chat</span>
            </Link>
            <span className="text-[var(--m-text-muted)]">/</span>
            <div className="flex items-center gap-1.5">
              <Shield size={13} strokeWidth={1.5} className="text-[var(--m-accent-red)]" />
              <span className="text-[13px] font-medium text-[var(--m-text-primary)]">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/chat" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[var(--m-text-muted)] hover:bg-white/[0.04] transition-colors">
              <ArrowLeft size={11} strokeWidth={1.5} />Chat
            </Link>
            <button onClick={() => signOut()} className="px-3 py-1.5 rounded-lg text-[11px] text-[var(--m-accent-red)]/80 hover:bg-[var(--m-accent-red)]/5 transition-colors">Sign Out</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-48 flex-shrink-0">
            <nav className="space-y-0.5">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-colors', tab === t.id ? 'font-medium bg-white/[0.04] text-[var(--m-text-primary)]' : 'text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.02]')}>
                  <t.icon size={15} strokeWidth={1.5} />{t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 size={18} className="animate-spin text-[var(--m-text-muted)]" /></div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {statCards.map((s) => (
                        <div key={s.label} className="p-4 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                          <div className="flex items-center gap-2 mb-2">
                            <s.icon size={15} strokeWidth={1.5} style={{ color: s.color }} />
                            <span className="text-[11px] text-[var(--m-text-muted)]">{s.label}</span>
                          </div>
                          <p className="text-2xl font-semibold text-[var(--m-text-primary)]">{s.value.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                      <h3 className="text-[13px] font-medium text-[var(--m-text-primary)] mb-4">Activity</h3>
                      <div className="flex items-end gap-2 h-28">
                        {[45, 62, 38, 75, 55, 88, 67].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-md transition-all" style={{ height: `${h}%`, backgroundColor: i === 5 ? 'var(--m-accent-blue)' : 'rgba(99,102,241,0.2)' }} />
                            <span className="text-[9px] text-[var(--m-text-muted)]">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {tab === 'users' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)] overflow-hidden overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        {['User', 'Role', 'Tier', 'Prompts', 'Joined'].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--m-text-muted)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-t border-white/[0.03]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[var(--m-accent-blue-soft)] flex items-center justify-center text-[10px] font-medium text-[var(--m-accent-blue)]">
                                {(u.display_name || 'U')[0].toUpperCase()}
                              </div>
                              <span className="text-[var(--m-text-primary)]">{u.display_name || 'Unnamed'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full capitalize', u.role === 'admin' ? 'bg-[var(--m-accent-red)]/10 text-[var(--m-accent-red)]' : 'bg-white/[0.04] text-[var(--m-text-muted)]')}>{u.role}</span></td>
                          <td className="px-4 py-3 text-[var(--m-text-muted)] capitalize">{u.subscription_tier}</td>
                          <td className="px-4 py-3 text-[var(--m-text-primary)]">{u.prompt_count}</td>
                          <td className="px-4 py-3 text-[11px] text-[var(--m-text-muted)]">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--m-text-muted)]">No users</td></tr>}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === 'analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Avg. Session', value: '4m 32s', icon: Activity },
                    { label: 'Msgs/User', value: stats.totalUsers > 0 ? (stats.totalMessages / stats.totalUsers).toFixed(1) : '0', icon: MessageSquare },
                    { label: 'Conversion', value: stats.totalUsers > 0 ? `${((stats.proUsers + stats.premiumUsers) / stats.totalUsers * 100).toFixed(1)}%` : '0%', icon: TrendingUp },
                    { label: 'Active', value: stats.totalMessages.toLocaleString(), icon: Eye },
                  ].map((s) => (
                    <div key={s.label} className="p-4 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                      <div className="flex items-center gap-2 mb-2">
                        <s.icon size={15} strokeWidth={1.5} className="text-[var(--m-accent-blue)]" />
                        <span className="text-[11px] text-[var(--m-text-muted)]">{s.label}</span>
                      </div>
                      <p className="text-xl font-semibold text-[var(--m-text-primary)]">{s.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                  <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)] mb-2">Feature Flags</h3>
                  <p className="text-[13px] text-[var(--m-text-muted)] mb-4">Manage feature availability.</p>
                  <div className="space-y-2">
                    {['image_generation', 'voice_conversations', 'document_upload', 'advanced_models', 'api_access'].map((flag) => (
                      <div key={flag} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                        <span className="text-[13px] text-[var(--m-text-primary)] capitalize">{flag.replace(/_/g, ' ')}</span>
                        <div className={cn('w-7 h-4 rounded-full relative cursor-pointer', flag === 'document_upload' ? 'bg-[var(--m-accent-blue)]' : 'bg-white/[0.08]')}>
                          <div className={cn('absolute top-[2px] w-3 h-3 rounded-full bg-white shadow transition-transform', flag === 'document_upload' ? 'translate-x-[14px]' : 'translate-x-[2px]')} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
