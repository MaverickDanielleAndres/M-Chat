import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Shield, Users, MessageSquare, TrendingUp, Activity, Settings, BarChart3, ArrowLeft, Loader2, Crown, Zap, HardDrive, Eye, ListTodo } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { UserManagementModal } from '@/components/admin/UserManagementModal';

type Tab = 'overview' | 'users' | 'analytics' | 'subscriptions' | 'audit' | 'settings';


export function AdminDashboard() {
  const navigate = useNavigate();
  const { role, isLoading, signOut } = useSupabaseAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ totalUsers: 0, totalChats: 0, totalMessages: 0, proUsers: 0, premiumUsers: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // New State
  const [plans, setPlans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any[]>([]);

  const addToast = useStore((s) => s.addToast);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(50);
      if (searchQuery) {
        query = query.or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      const { data: ud } = await query;
      if (ud) setUsers(ud);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!isLoading && role !== 'admin') navigate('/dashboard'); }, [isLoading, role, navigate]);

  useEffect(() => {
    if (role !== 'admin') return;
    let mounted = true;
    
    const fetchStats = async () => {
      try {
        const { count: tu } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        const { count: pu } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro');
        const { count: pru } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'premium');
        const { count: tc } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
        const { count: tm } = await supabase.from('messages').select('*', { count: 'exact', head: true });
        if (mounted) setStats({ totalUsers: tu || 0, totalChats: tc || 0, totalMessages: tm || 0, proUsers: pu || 0, premiumUsers: pru || 0 });
      } catch { /* ignore */ }
    };

    const fetchAdminData = async () => {
      try {
        const { data: p } = await supabase.from('subscription_plans').select('*').order('price_monthly', { ascending: true });
        if (p && mounted) setPlans(p);
        
        const { data: a } = await supabase.from('audit_events').select('*').order('created_at', { ascending: false }).limit(50);
        if (a && mounted) setAuditLogs(a);

        const { data: s } = await supabase.from('system_config').select('*');
        if (s && mounted) setSystemConfig(s);
      } catch { /* ignore */ }
    };

    fetchStats();
    fetchUsers();
    fetchAdminData();
    
    // Set up real-time subscriptions for Admin Dashboard
    const adminChannel = supabase.channel('admin_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_events' }, (payload: any) => {
        if (mounted) {
          if (payload.eventType === 'INSERT') {
            setAuditLogs(prev => [payload.new, ...prev].slice(0, 50));
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
        if (mounted) {
          fetchStats();
          fetchUsers();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        if (mounted) fetchStats();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(adminChannel);
    };
  }, [role, searchQuery]);

  const updateConfig = async (key: string, newValue: any) => {
    try {
      await supabase.from('system_config').upsert({ key, value: newValue });
      setSystemConfig(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    } catch { /* ignore */ }
  };


  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#050507]"><Loader2 size={20} className="animate-spin text-[var(--m-text-muted)]" /></div>;
  if (role !== 'admin') return null;

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'analytics' as Tab, label: 'Analytics', icon: Activity },
    { id: 'subscriptions' as Tab, label: 'Subscriptions', icon: Crown },
    { id: 'audit' as Tab, label: 'Audit Logs', icon: ListTodo },
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
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)]">User Management</h3>
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[var(--m-bg-elevated)] border border-white/[0.04] rounded-xl px-4 py-2 text-[12px] text-[var(--m-text-primary)] outline-none focus:border-[var(--m-accent-blue)] transition-colors w-64"
                  />
                </div>
                <div className="rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)] overflow-hidden overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        {['User', 'Email', 'Role', 'Tier', 'Joined'].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--m-text-muted)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setSelectedUser(u)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[var(--m-accent-blue-soft)] flex items-center justify-center text-[10px] font-medium text-[var(--m-accent-blue)]">
                                {(u.display_name || 'U')[0].toUpperCase()}
                              </div>
                              <span className="text-[var(--m-text-primary)]">{u.display_name || 'Unnamed'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-[var(--m-text-muted)] truncate max-w-[150px]">{u.email || '-'}</td>
                          <td className="px-4 py-3"><span className={cn('text-[10px] px-2 py-0.5 rounded-full capitalize', u.role === 'admin' || u.role === 'developer' ? 'bg-[var(--m-accent-red)]/10 text-[var(--m-accent-red)]' : 'bg-white/[0.04] text-[var(--m-text-muted)]')}>{u.role}</span></td>
                          <td className="px-4 py-3 text-[var(--m-text-muted)] capitalize">{u.subscription_tier}</td>
                          <td className="px-4 py-3 text-[11px] text-[var(--m-text-muted)]">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--m-text-muted)]">No users found</td></tr>}
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

            {tab === 'subscriptions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)]">Subscription Plans</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {plans.map((p) => (
                    <div key={p.id} className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] font-medium text-[var(--m-text-primary)] capitalize">{p.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--m-accent-blue-soft)] text-[var(--m-accent-blue)]">
                          ${p.price_monthly}/mo
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[var(--m-text-muted)]">Daily Prompts:</span>
                          <span className="text-[var(--m-text-primary)]">{p.max_prompts_daily === -1 ? 'Unlimited' : p.max_prompts_daily}</span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[var(--m-text-muted)]">Image Gen:</span>
                          <span className="text-[var(--m-text-primary)]">{p.includes_image_gen ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const daily = prompt(`Daily prompts for "${p.name}" (-1 for unlimited):`, String(p.max_prompts_daily));
                          if (daily === null) return;
                          const credits = prompt(`Monthly credits for "${p.name}":`, String(p.monthly_credits));
                          if (credits === null) return;
                          (async () => {
                            try {
                              const { error } = await supabase
                                .from('subscription_plans')
                                .update({
                                  max_prompts_daily: Number(daily),
                                  monthly_credits: Number(credits),
                                  updated_at: new Date().toISOString(),
                                })
                                .eq('id', p.id);
                              if (error) throw error;
                              addToast({ type: 'success', message: `Plan "${p.name}" updated.` });
                              // Refresh local plan list so the change is visible
                              const { data: refreshed } = await supabase
                                .from('subscription_plans')
                                .select('*')
                                .order('price_monthly', { ascending: true });
                              if (refreshed) setPlans(refreshed);
                            } catch (err) {
                              addToast({
                                type: 'error',
                                message: err instanceof Error ? err.message : 'Failed to update plan',
                              });
                            }
                          })();
                        }}
                        className="w-full mt-2 py-1.5 rounded-lg border border-white/[0.04] text-[11px] text-[var(--m-text-muted)] hover:bg-white/[0.02] transition-colors"
                      >
                        Edit Plan Limits
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === 'audit' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)] overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        {['Date', 'Actor ID', 'Action', 'Entity', 'Details'].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[var(--m-text-muted)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((a) => (
                        <tr key={a.id} className="border-t border-white/[0.03]">
                          <td className="px-4 py-3 text-[11px] text-[var(--m-text-muted)]">{new Date(a.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 text-[11px] text-[var(--m-text-muted)] truncate max-w-[100px]">{a.actor_id || 'System'}</td>
                          <td className="px-4 py-3 text-[12px] text-[var(--m-text-primary)]">{a.action}</td>
                          <td className="px-4 py-3 text-[12px] text-[var(--m-text-muted)]">{a.entity}</td>
                          <td className="px-4 py-3 text-[11px] text-[var(--m-text-muted)]">
                            <pre className="max-w-[200px] overflow-hidden truncate">{JSON.stringify(a.payload)}</pre>
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--m-text-muted)]">No audit logs found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-5 rounded-2xl border border-white/[0.04] bg-[var(--m-bg-elevated)]">
                  <h3 className="text-[15px] font-semibold text-[var(--m-text-primary)] mb-2">Global Settings</h3>
                  <p className="text-[13px] text-[var(--m-text-muted)] mb-4">Manage app-wide configurations.</p>
                  <div className="space-y-4">
                    {systemConfig.map((config) => (
                      <div key={config.key} className="p-4 bg-black/20 rounded-xl border border-white/[0.02]">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-[13px] font-medium text-[var(--m-text-primary)] capitalize">{config.key}</span>
                            <p className="text-[11px] text-[var(--m-text-muted)]">{config.description}</p>
                          </div>
                          <div 
                            onClick={() => updateConfig(config.key, { ...config.value, enabled: !config.value.enabled })}
                            className={cn('w-8 h-4.5 rounded-full relative cursor-pointer', config.value.enabled ? 'bg-[var(--m-accent-blue)]' : 'bg-white/[0.08]')}
                          >
                            <div className={cn('absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white shadow transition-transform', config.value.enabled ? 'translate-x-[16px]' : 'translate-x-[2px]')} />
                          </div>
                        </div>
                        {config.key === 'announcement' && (
                          <input 
                            type="text" 
                            value={config.value.message}
                            onChange={(e) => updateConfig(config.key, { ...config.value, message: e.target.value })}
                            className="mt-2 w-full bg-black/40 border border-white/[0.04] rounded-lg px-3 py-1.5 text-[12px] text-[var(--m-text-primary)] outline-none focus:border-[var(--m-accent-blue)] transition-colors"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
      {selectedUser && (
        <UserManagementModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onUpdated={fetchUsers} 
        />
      )}
    </div>
  );
}
