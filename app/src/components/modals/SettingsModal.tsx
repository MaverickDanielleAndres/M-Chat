import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Type, Zap, Volume2, Code, Trash2, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/types';

export function SettingsModal() {
  const { settings, settingsOpen, toggleSettings, updateSettings, exportData, importData, resetEverything, addToast } = useStore();
  const [tab, setTab] = useState<'general' | 'data'>('general');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `m-chat-backup-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast({ type: 'success', message: 'Exported' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target?.result as string);
      addToast({ type: ok ? 'success' : 'error', message: ok ? 'Imported' : 'Failed' });
    };
    reader.readAsText(file); e.target.value = '';
  };

  if (!settingsOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={toggleSettings}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--m-bg-elevated)] shadow-2xl"
          onClick={(e) => e.stopPropagation()} data-dialog>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
            <h2 className="text-[15px] font-semibold text-[var(--m-text-primary)]">Settings</h2>
            <button onClick={toggleSettings} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-[var(--m-text-muted)] transition-colors"><X size={16} strokeWidth={1.5} /></button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-6 pt-4 border-b border-white/[0.04]">
            {(['general', 'data'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 py-2.5 text-[13px] font-medium capitalize transition-colors border-b-2', tab === t ? 'border-[var(--m-accent-blue)] text-[var(--m-accent-blue)]' : 'border-transparent text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)]')}>
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {tab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-medium text-[var(--m-text-primary)] mb-3 block">Theme</label>
                  <div className="flex gap-2">
                    {([{ v: 'light' as ThemeMode, i: Sun, l: 'Light' }, { v: 'dark' as ThemeMode, i: Moon, l: 'Dark' }, { v: 'system' as ThemeMode, i: Monitor, l: 'System' }]).map(({ v, i: Icon, l }) => (
                      <button key={v} onClick={() => updateSettings({ theme: v })}
                        className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] border transition-all', settings.theme === v ? 'border-[var(--m-accent-blue)]/30 bg-[var(--m-accent-blue-soft)] text-[var(--m-accent-blue)]' : 'border-white/[0.06] text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)]')}>
                        <Icon size={14} strokeWidth={1.5} /><span className="hidden sm:inline">{l}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[var(--m-text-primary)] mb-3 block flex items-center gap-2"><Type size={14} strokeWidth={1.5} className="text-[var(--m-text-muted)]" /> Font Size</label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((s) => (
                      <button key={s} onClick={() => updateSettings({ fontSize: s })}
                        className={cn('flex-1 py-2.5 rounded-xl text-[13px] capitalize border transition-all', settings.fontSize === s ? 'border-[var(--m-accent-blue)]/30 bg-[var(--m-accent-blue-soft)] text-[var(--m-accent-blue)]' : 'border-white/[0.06] text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)]')}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Toggle icon={Zap} label="Animations" desc="UI animations" enabled={settings.animationsEnabled} onChange={(v: boolean) => updateSettings({ animationsEnabled: v })} />
                  <Toggle icon={Volume2} label="Sound" desc="Notification sounds" enabled={settings.soundEnabled} onChange={(v: boolean) => updateSettings({ soundEnabled: v })} />
                  <Toggle icon={Code} label="Developer Mode" desc="Show API stats" enabled={settings.developerMode} onChange={(v: boolean) => updateSettings({ developerMode: v })} />
                </div>
              </div>
            )}

            {tab === 'data' && (
              <div className="space-y-2">
                {[
                  { icon: Download, label: 'Export Data', desc: 'Download all data', action: handleExport, color: 'var(--m-accent-blue)' },
                  { icon: Upload, label: 'Import Data', desc: 'Restore from backup', action: () => document.getElementById('import-file')?.click(), color: 'var(--m-accent-green)' },
                  { icon: RotateCcw, label: 'Reset Settings', desc: 'Restore defaults', action: () => updateSettings({ theme: 'system', animationsEnabled: true, soundEnabled: true, developerMode: false, fontSize: 'medium' }), color: 'var(--m-text-muted)' },
                ].map((item) => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.04] hover:bg-white/[0.02] transition-colors text-left">
                    <item.icon size={16} strokeWidth={1.5} style={{ color: item.color }} />
                    <div>
                      <p className="text-[13px] font-medium text-[var(--m-text-primary)]">{item.label}</p>
                      <p className="text-[11px] text-[var(--m-text-muted)]">{item.desc}</p>
                    </div>
                  </button>
                ))}
                <input id="import-file" type="file" accept=".json" onChange={handleImport} className="hidden" />

                <div className="border-t border-white/[0.04] pt-3 mt-3">
                  {!confirmReset ? (
                    <button onClick={() => setConfirmReset(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--m-accent-red)]/20 hover:bg-[var(--m-accent-red)]/5 transition-colors text-left">
                      <Trash2 size={16} strokeWidth={1.5} className="text-[var(--m-accent-red)]" />
                      <div>
                        <p className="text-[13px] font-medium text-[var(--m-accent-red)]">Reset Everything</p>
                        <p className="text-[11px] text-[var(--m-text-muted)]">Delete all data</p>
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-[var(--m-accent-red)]/5 border border-[var(--m-accent-red)]/15">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle size={16} className="text-[var(--m-accent-red)] flex-shrink-0 mt-0.5" />
                        <p className="text-[12px] text-[var(--m-accent-red)]">This permanently deletes all data.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { resetEverything(); setConfirmReset(false); toggleSettings(); addToast({ type: 'info', message: 'All data reset' }); }}
                          className="flex-1 py-2 rounded-lg text-[12px] font-medium text-white bg-[var(--m-accent-red)] hover:opacity-90 transition-opacity">Confirm</button>
                        <button onClick={() => setConfirmReset(false)}
                          className="flex-1 py-2 rounded-lg text-[12px] font-medium border border-white/[0.06] text-[var(--m-text-primary)] hover:bg-white/[0.03] transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Toggle({ icon: Icon, label, desc, enabled, onChange }: any) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon size={15} strokeWidth={1.5} className="text-[var(--m-text-muted)]" />
        <div>
          <p className="text-[13px] font-medium text-[var(--m-text-primary)]">{label}</p>
          <p className="text-[11px] text-[var(--m-text-muted)]">{desc}</p>
        </div>
      </div>
      <button onClick={() => onChange(!enabled)}
        className={cn('relative w-9 h-5 rounded-full transition-colors', enabled ? 'bg-[var(--m-accent-blue)]' : 'bg-white/[0.08]')}>
        <motion.div animate={{ x: enabled ? 16 : 2 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}
