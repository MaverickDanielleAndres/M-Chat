import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Zap,
  Code,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Settings as SettingsIcon,
  Palette,
  Sparkles,
  Eye,
  EyeOff,
  Keyboard,
  User,
  Database,
  Wallet,
  TrendingUp,
  Save,
  LogOut,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn } from '@/lib/utils';
import type { ThemeMode, AppSettings } from '@/types';
import { Link, useNavigate } from 'react-router';

type Tab = 'general' | 'appearance' | 'chat' | 'account' | 'data';

const ACCENT_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#0ea5e9', '#64748b',
];

export function SettingsModal() {
  const {
    settings,
    settingsOpen,
    toggleSettings,
    updateSettings,
    setTheme,
    resetSettings,
    exportData,
    importData,
    resetEverything,
    addToast,
    wallet,
    profile,
  } = useStore();
  const { user, signOut, updateProfile } = useSupabaseAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('general');
  const [confirmReset, setConfirmReset] = useState(false);
  const [showCustomInstr, setShowCustomInstr] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState((profile as any)?.bio ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setBio((profile as any)?.bio ?? '');
  }, [profile?.display_name, (profile as any)?.bio]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updates: any = {};
      if (displayName.trim()) updates.display_name = displayName.trim();
      if (bio.trim()) updates.bio = bio.trim();
      const { error } = await updateProfile(updates);
      if (error) throw error;
      addToast({ type: 'success', message: 'Profile updated' });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOutAndClose = async () => {
    await signOut();
    toggleSettings();
    navigate('/');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `m-chat-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: 'Data exported' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target?.result as string);
      addToast({ type: ok ? 'success' : 'error', message: ok ? 'Imported' : 'Failed' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!settingsOpen) return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'chat', label: 'Chat', icon: Sparkles },
    { id: 'account', label: 'Account', icon: User },
    { id: 'data', label: 'Data', icon: Database },
  ];

  const tier = (profile?.subscription_tier as string) ?? 'free';
  const tierLabel =
    tier === 'pro' ? 'Pro'
    : tier === 'premium' ? 'Premium'
    : tier === 'admin' ? 'Admin'
    : tier === 'developer' ? 'Developer'
    : 'Free';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={toggleSettings}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
          data-dialog
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
            <h2 className="text-[15px] font-semibold flex items-center gap-2 text-foreground">
              <SettingsIcon size={15} className="text-indigo-500" />
              Settings
            </h2>
            <button
              onClick={toggleSettings}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
              aria-label="Close settings"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0">
            {/* Side tabs */}
            <nav className="hidden sm:flex w-44 border-r border-border p-2 gap-0.5 flex-col flex-shrink-0">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left',
                      tab === t.id
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <Icon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </nav>

            {/* Tab bar mobile */}
            <div className="sm:hidden flex overflow-x-auto px-2 py-2 border-b border-border gap-1 flex-shrink-0 w-full">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium flex-shrink-0',
                      tab === t.id ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <Icon size={12} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === 'general' && <GeneralTab wallet={wallet} tier={tier} tierLabel={tierLabel} />}
              {tab === 'appearance' && (
                <AppearanceTab settings={settings} setTheme={setTheme} updateSettings={updateSettings} />
              )}
              {tab === 'chat' && (
                <ChatTab
                  settings={settings}
                  updateSettings={updateSettings}
                  showCustomInstr={showCustomInstr}
                  setShowCustomInstr={setShowCustomInstr}
                />
              )}
              {tab === 'account' && (
                <AccountTab
                  tier={tier}
                  tierLabel={tierLabel}
                  email={user?.email ?? null}
                  displayName={displayName}
                  bio={bio}
                  onChangeName={setDisplayName}
                  onChangeBio={setBio}
                  onSave={handleSaveProfile}
                  savingProfile={savingProfile}
                  onSignOut={handleSignOutAndClose}
                />
              )}
              {tab === 'data' && (
                <DataTab
                  onExport={handleExport}
                  onImport={handleImport}
                  onResetSettings={async () => {
                    await resetSettings();
                    addToast({ type: 'success', message: 'Settings reset' });
                  }}
                  confirmReset={confirmReset}
                  setConfirmReset={setConfirmReset}
                  onResetEverything={async () => {
                    if (!user) {
                      // Not signed in — just nuke the local state.
                      await resetEverything();
                      setConfirmReset(false);
                      toggleSettings();
                      addToast({ type: 'info', message: 'Local data cleared.' });
                      return;
                    }
                    try {
                      // Full account deletion: conversations, messages,
                      // attachments, settings, wallet — then sign out. The
                      // auth.users row itself requires the admin API; we mark
                      // the profile as deleted so all RLS-gated tables are
                      // effectively orphaned, then sign out.
                      await resetEverything();
                      // Drop user-owned server artifacts directly. resetEverything
                      // handles `conversations` already, but other tables need
                      // explicit cleanup so re-registering with the same email
                      // doesn't resurrect stale data.
                      const { supabase } = await import('@/lib/supabase');
                      await Promise.allSettled([
                        supabase.from('messages').delete().eq('conversation_id', ''),
                        supabase.from('attachments').delete().eq('user_id', user.id),
                        supabase.from('app_settings').delete().eq('user_id', user.id),
                        supabase.from('credit_wallets').delete().eq('user_id', user.id),
                        supabase.from('credit_transactions').delete().eq('user_id', user.id),
                        supabase.from('user_profiles').delete().eq('id', user.id),
                      ]);
                      await signOut();
                      setConfirmReset(false);
                      toggleSettings();
                      addToast({
                        type: 'success',
                        message: 'Account deleted. You have been signed out.',
                      });
                      navigate('/');
                    } catch (err) {
                      addToast({
                        type: 'error',
                        message: err instanceof Error ? err.message : 'Failed to delete account',
                      });
                    }
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// tabs
// ---------------------------------------------------------------------------
function GeneralTab({
  wallet,
  tier,
  tierLabel,
}: {
  wallet: { balance: number; daily_quota: number; daily_used: number };
  tier: string;
  tierLabel: string;
}) {
  const unlimited = wallet.daily_quota === -1;
  const pct = unlimited
    ? 100
    : Math.min(100, Math.round((wallet.daily_used / Math.max(1, wallet.daily_quota)) * 100));

  return (
    <div className="space-y-6">
      {/* Usage */}
      <Section title="Usage">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp size={15} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground">Daily quota</p>
                <p className="text-lg font-semibold leading-tight">
                  {unlimited ? '∞' : `${wallet.daily_used}`}
                  <span className="text-muted-foreground text-[12px] font-normal">
                    {' '}/ {unlimited ? 'unlimited' : `${wallet.daily_quota} prompts`}
                  </span>
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-medium uppercase tracking-wider">
              {tierLabel}
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Wallet size={11} /> Balance: {wallet.balance} credits
            </span>
            {tier === 'free' || tier === 'registered' ? (
              <Link to="/upgrade" className="text-indigo-500 hover:underline">
                Upgrade for unlimited
              </Link>
            ) : (
              <span className="text-emerald-500">Unlimited</span>
            )}
          </div>
        </div>
      </Section>

      <Section title="About">
        <p className="text-[13px] text-muted-foreground">
          M-Chat is a multi-modal AI workspace. Chat, generate, and analyze — all in one place.
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-[11px] text-muted-foreground">Version 1.0</p>
          <img src="/logonobg.png" alt="M-Chat" className="w-3.5 h-3.5 opacity-70" />
        </div>
      </Section>

      <Section title="Keyboard shortcuts">
        <div className="space-y-1.5 text-[12px]">
          <Row label="Send message" kbd="Enter" />
          <Row label="New line" kbd="Shift+Enter" />
          <Row label="Focus search" kbd="Ctrl+K" />
          <Row label="Toggle sidebar" kbd="Ctrl+B" />
          <Row label="Open settings" kbd="Ctrl+," />
        </div>
      </Section>
    </div>
  );
}

function AppearanceTab({
  settings,
  setTheme,
  updateSettings,
}: {
  settings: AppSettings;
  setTheme: (t: ThemeMode) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Theme">
        <Segmented
          value={settings.theme}
          onChange={(v) => setTheme(v as ThemeMode)}
          options={[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor },
          ]}
        />
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {settings.theme === 'system'
            ? 'Following your OS preference.'
            : `Always ${settings.theme === 'dark' ? 'dark' : 'light'}, regardless of OS.`}
        </p>
      </Section>

      <Section title="Accent color">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => updateSettings({ accentColor: color })}
              className={cn(
                'aspect-square rounded-lg border-2 transition-all',
                settings.accentColor === color
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Accent color ${color}`}
            />
          ))}
        </div>
      </Section>

      <Section title="Font size">
        <Segmented
          value={settings.fontSize}
          onChange={(v) => updateSettings({ fontSize: v as any })}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
            { value: 'xl', label: 'XL' },
          ]}
        />
      </Section>

      <Section title="Font family">
        <Segmented
          value={settings.fontFamily}
          onChange={(v) => updateSettings({ fontFamily: v as any })}
          options={[
            { value: 'sans', label: 'Sans' },
            { value: 'serif', label: 'Serif' },
            { value: 'mono', label: 'Mono' },
          ]}
        />
      </Section>

      <Section title="Density">
        <Segmented
          value={settings.density}
          onChange={(v) => updateSettings({ density: v as any })}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Cozy' },
            { value: 'spacious', label: 'Roomy' },
          ]}
        />
      </Section>

      <Section title="Motion">
        <Toggle
          icon={Zap}
          label="Animations"
          desc="Enable transitions and motion"
          enabled={settings.animationsEnabled}
          onChange={(v) => updateSettings({ animationsEnabled: v })}
        />
      </Section>
    </div>
  );
}

function ChatTab({
  settings,
  updateSettings,
  showCustomInstr,
  setShowCustomInstr,
}: {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  showCustomInstr: boolean;
  setShowCustomInstr: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Behavior">
        <Toggle
          icon={Keyboard}
          label="Enter to send"
          desc="Use Shift+Enter for new line"
          enabled={settings.enterToSend}
          onChange={(v) => updateSettings({ enterToSend: v })}
        />
        <Toggle
          icon={Sparkles}
          label="Stream responses"
          desc="Show tokens as they arrive"
          enabled={settings.streamResponses}
          onChange={(v) => updateSettings({ streamResponses: v })}
        />
        <Toggle
          icon={Eye}
          label="Show token counts"
          desc="Display token usage under messages"
          enabled={settings.showTokenCounts}
          onChange={(v) => updateSettings({ showTokenCounts: v })}
        />
        <Toggle
          icon={Code}
          label="Developer mode"
          desc="Show API stats in console"
          enabled={settings.developerMode}
          onChange={(v) => updateSettings({ developerMode: v })}
        />
      </Section>

      <Section title="Default model">
        <select
          value={settings.defaultModel ?? 'gemini-2.0-flash'}
          onChange={(e) => updateSettings({ defaultModel: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] focus:border-indigo-500 outline-none text-foreground"
        >
          <option value="gemini-2.0-flash">Gemini 2.0 Flash · fast</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro · balanced</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash · quick</option>
        </select>
      </Section>

      <Section title="Custom instructions">
        <p className="text-[11px] text-muted-foreground mb-2">
          Tell the AI how to respond. These instructions apply to every conversation.
        </p>
        <button
          onClick={() => setShowCustomInstr(!showCustomInstr)}
          className="flex items-center gap-1.5 text-[12px] text-indigo-500 hover:underline"
        >
          {showCustomInstr ? <EyeOff size={12} /> : <Eye size={12} />}
          {showCustomInstr ? 'Hide editor' : 'Show editor'}
        </button>
        {showCustomInstr && (
          <textarea
            value={settings.customInstructions ?? ''}
            onChange={(e) => updateSettings({ customInstructions: e.target.value })}
            placeholder="e.g. Always reply in concise bullet points. Prefer TypeScript over JavaScript."
            rows={4}
            className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-[13px] resize-y outline-none focus:border-indigo-500 text-foreground"
          />
        )}
      </Section>

      <Section title="Language">
        <select
          value={settings.language ?? 'en'}
          onChange={(e) => updateSettings({ language: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] focus:border-indigo-500 outline-none text-foreground"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="it">Italiano</option>
          <option value="pt">Português</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
          <option value="zh">中文</option>
          <option value="tl">Tagalog</option>
        </select>
      </Section>
    </div>
  );
}

function AccountTab({
  tier,
  tierLabel,
  email,
  displayName,
  bio,
  onChangeName,
  onChangeBio,
  onSave,
  savingProfile,
  onSignOut,
}: {
  tier: string;
  tierLabel: string;
  email: string | null;
  displayName: string;
  bio: string;
  onChangeName: (v: string) => void;
  onChangeBio: (v: string) => void;
  onSave: () => void;
  savingProfile: boolean;
  onSignOut: () => void;
}) {
  const isAuthed = Boolean(email);
  return (
    <div className="space-y-6">
      <Section title="Profile">
        {!isAuthed ? (
          <div className="rounded-xl border border-border p-4 bg-muted/30">
            <p className="text-[13px] text-muted-foreground">
              You're browsing as a guest.{' '}
              <Link to="/login" className="text-indigo-500 hover:underline">
                Sign in
              </Link>{' '}
              to save your profile, conversations, and usage data.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                value={email ?? ''}
                disabled
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-[13px] text-muted-foreground outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Display name
              </label>
              <input
                value={displayName}
                onChange={(e) => onChangeName(e.target.value)}
                placeholder="Your display name"
                maxLength={64}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => onChangeBio(e.target.value)}
                placeholder="A short bio (optional)"
                rows={3}
                maxLength={240}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] outline-none focus:border-indigo-500 resize-y"
              />
            </div>
            <button
              onClick={onSave}
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              <Save size={12} /> {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        )}
      </Section>

      <Section title="Subscription">
        <div className="rounded-xl border border-border p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current plan</p>
              <p className="text-lg font-semibold mt-0.5">{tierLabel}</p>
            </div>
            <span className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider',
              tier === 'pro' || tier === 'premium'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
                : 'bg-muted text-muted-foreground'
            )}>
              Active
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mb-3">
            {tier === 'pro'
              ? 'Unlimited prompts · 10GB storage · Priority support'
              : tier === 'premium'
              ? 'Everything in Pro plus advanced AI models and team workspace'
              : tier === 'registered'
              ? '50 daily prompts · Cloud sync across devices'
              : '10 daily prompts · Local storage only'}
          </p>
          <Link
            to="/upgrade"
            className="block w-full text-center py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            {tier === 'free' || tier === 'registered' ? 'Upgrade to Pro' : 'Manage subscription'}
          </Link>
        </div>
      </Section>

      <Section title="Privacy">
        <p className="text-[12px] text-muted-foreground mb-2">
          Conversation history and notifications are configured automatically based on your account tier.
          Contact support for custom data-handling preferences.
        </p>
      </Section>

      {isAuthed && (
        <Section title="Session">
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-[12px] font-medium hover:bg-red-500/10"
          >
            <LogOut size={12} /> Sign out
          </button>
        </Section>
      )}
    </div>
  );
}

function DataTab({
  onExport,
  onImport,
  onResetSettings,
  confirmReset,
  setConfirmReset,
  onResetEverything,
}: {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSettings: () => void;
  confirmReset: boolean;
  setConfirmReset: (v: boolean) => void;
  onResetEverything: () => void;
}) {
  return (
    <div className="space-y-3">
      <DataRow icon={Download} label="Export data" desc="Download all conversations and settings" onClick={onExport} />
      <DataRow icon={Upload} label="Import data" desc="Restore from a backup file" onClick={() => document.getElementById('import-file')?.click()} />
      <input id="import-file" type="file" accept=".json" onChange={onImport} className="hidden" />
      <DataRow icon={RotateCcw} label="Reset settings" desc="Restore defaults without losing chats" onClick={onResetSettings} />
      <div className="border-t border-border pt-3 mt-3">
        {!confirmReset ? (
          <DataRow
            icon={Trash2}
            label="Reset everything"
            desc="Permanently delete all conversations, settings, and account data"
            onClick={() => setConfirmReset(true)}
            danger
          />
        ) : (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-500">This permanently deletes all data. There is no undo.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onResetEverything}
                className="flex-1 py-2 rounded-lg text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 rounded-lg text-[12px] font-medium border border-border hover:bg-muted transition-colors text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// shared atoms
// ---------------------------------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SegmentedOption[];
}) {
  return (
    <div
      className="grid gap-1 p-1 rounded-full bg-muted border border-border"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[12px] font-medium transition-all',
              selected
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon size={12} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  icon: Icon,
  label,
  desc,
  enabled,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  desc: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2 px-3 -mx-3 rounded-lg transition-colors',
        !disabled && 'hover:bg-muted/40 cursor-pointer'
      )}
      onClick={() => !disabled && onChange(!enabled)}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center border transition-colors',
            enabled
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
              : 'bg-muted border-border text-muted-foreground'
          )}
        >
          <Icon size={13} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-tight text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(!enabled);
        }}
        style={{
          width: 48,
          height: 26,
          borderRadius: 9999,
          background: enabled ? '#6366f1' : 'rgba(128,128,128,0.25)',
          transition: 'background-color 0.2s ease',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
          border: 'none',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 18,
            height: 18,
            borderRadius: 9999,
            background: '#ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            transform: enabled ? 'translateX(22px)' : 'translateX(0)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
    </div>
  );
}

function Row({ label, kbd }: { label: string; kbd: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <kbd className="px-1.5 py-0.5 rounded-md border border-border bg-muted font-mono text-[10px] text-foreground">
        {kbd}
      </kbd>
    </div>
  );
}

function DataRow({
  icon: Icon,
  label,
  desc,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  desc: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left',
        danger && 'border-red-500/30 hover:bg-red-500/10'
      )}
    >
      <Icon size={14} className={danger ? 'text-red-500' : 'text-muted-foreground'} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-[13px] font-medium', danger && 'text-red-500')}>{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
      </div>
    </button>
  );
}