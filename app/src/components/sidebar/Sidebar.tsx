import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Pencil, Pin, Copy, X, MessageSquare, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn, formatTimestamp } from '@/lib/utils';
import { FREE_PROMPT_LIMIT } from '@/types';

export function Sidebar() {
  const {
    conversations, activeConversationId, sidebarOpen, searchQuery, promptCount,
    createConversation, setActiveConversation, deleteConversation,
    renameConversation, pinConversation, duplicateConversation,
    toggleSidebar, setSearchQuery, toggleSettings,
  } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (editingId && editRef.current) { editRef.current.focus(); editRef.current.select(); } }, [editingId]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = conversations
    .filter((c) => { const q = searchQuery.toLowerCase(); return c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)); })
    .sort((a, b) => { if (a.pinned && !b.pinned) return -1; if (!a.pinned && b.pinned) return 1; return b.updatedAt - a.updatedAt; });
  const pinned = filtered.filter((c) => c.pinned);
  const recent = filtered.filter((c) => !c.pinned);

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => toggleSidebar()} />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280, width: 280 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn('fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-white/[0.04] bg-[var(--m-bg-elevated)] lg:relative lg:translate-x-0')}
        style={{ width: 280 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-6 h-6 rounded-md bg-[var(--m-accent-blue)] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">M</span>
            </div>
            <span className="font-semibold text-sm text-[var(--m-text-primary)] tracking-tight">M-Chat</span>
          </div>
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-[var(--m-text-muted)] transition-colors lg:hidden">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 py-2.5">
          <button
            onClick={() => createConversation()}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[13px] font-medium bg-white/[0.04] text-[var(--m-text-primary)] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all"
          >
            <Plus size={14} strokeWidth={1.5} /> New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)]" strokeWidth={1.5} />
            <input
              data-search-input type="text" placeholder="Search chats..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-[13px] rounded-xl bg-white/[0.02] text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] border border-white/[0.04] outline-none focus:border-[var(--m-accent-blue)]/20 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)]">
                <X size={12} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-1">
          {pinned.length > 0 && (
            <div className="mb-2">
              <div className="px-2.5 py-1.5 text-[10px] font-medium text-[var(--m-text-muted)] uppercase tracking-wider">Pinned</div>
              {pinned.map((c) => <ConvItem key={c.id} conv={c} isActive={c.id === activeConversationId} isEditing={editingId === c.id} editValue={editValue} menuOpenId={menuOpenId} onSelect={() => setActiveConversation(c.id)} onStartEdit={() => { setEditingId(c.id); setEditValue(c.title); setMenuOpenId(null); }} onSaveEdit={() => { if (editingId && editValue.trim()) renameConversation(editingId, editValue.trim()); setEditingId(null); }} onEditChange={setEditValue} onToggleMenu={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)} onDelete={() => deleteConversation(c.id)} onPin={() => pinConversation(c.id)} onDuplicate={() => duplicateConversation(c.id)} editRef={editRef} menuRef={menuRef} />)}
            </div>
          )}
          <div>
            {recent.length > 0 && <div className="px-2.5 py-1.5 text-[10px] font-medium text-[var(--m-text-muted)] uppercase tracking-wider">{searchQuery ? 'Results' : 'Recent'}</div>}
            {recent.map((c) => <ConvItem key={c.id} conv={c} isActive={c.id === activeConversationId} isEditing={editingId === c.id} editValue={editValue} menuOpenId={menuOpenId} onSelect={() => setActiveConversation(c.id)} onStartEdit={() => { setEditingId(c.id); setEditValue(c.title); setMenuOpenId(null); }} onSaveEdit={() => { if (editingId && editValue.trim()) renameConversation(editingId, editValue.trim()); setEditingId(null); }} onEditChange={setEditValue} onToggleMenu={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)} onDelete={() => deleteConversation(c.id)} onPin={() => pinConversation(c.id)} onDuplicate={() => duplicateConversation(c.id)} editRef={editRef} menuRef={menuRef} />)}
            {recent.length === 0 && pinned.length === 0 && <div className="text-center py-8 text-[var(--m-text-muted)] text-[13px]">{searchQuery ? 'No chats found' : 'No conversations yet'}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.04] p-3 space-y-2.5 flex-shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--m-text-muted)]">Free prompts</span>
            <span className={cn('font-mono font-medium', promptCount >= FREE_PROMPT_LIMIT * 0.8 ? 'text-[var(--m-accent-red)]' : 'text-[var(--m-text-secondary)]')}>
              {promptCount}/{FREE_PROMPT_LIMIT}
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div className={cn('h-full rounded-full', promptCount >= FREE_PROMPT_LIMIT ? 'bg-[var(--m-accent-red)]' : promptCount >= FREE_PROMPT_LIMIT * 0.8 ? 'bg-amber-500' : 'bg-[var(--m-accent-green)]')} animate={{ width: `${Math.min((promptCount / FREE_PROMPT_LIMIT) * 100, 100)}%` }} transition={{ duration: 0.3 }} />
          </div>
          <button onClick={toggleSettings} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-white/[0.04] transition-colors text-[12px]">
            <Sparkles size={13} strokeWidth={1.5} /> Settings
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function ConvItem({ conv, isActive, isEditing, editValue, menuOpenId, onSelect, onStartEdit, onSaveEdit, onEditChange, onToggleMenu, onDelete, onPin, onDuplicate, editRef, menuRef }: any) {
  const menuOpen = menuOpenId === conv.id;
  return (
    <div className={cn('group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors', isActive ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]')} onClick={() => { if (!isEditing && !menuOpen) onSelect(); }}>
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-[var(--m-accent-blue)]" />}
      {conv.pinned && <Pin size={11} className="text-[var(--m-accent-blue)] flex-shrink-0" strokeWidth={1.5} />}
      {isEditing ? (
        <input ref={editRef} value={editValue} onChange={(e) => onEditChange(e.target.value)} onBlur={onSaveEdit} onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onEditChange(conv.title); }} className="flex-1 text-[13px] bg-transparent outline-none text-[var(--m-text-primary)] border-b border-[var(--m-accent-blue)]" />
      ) : (
        <>
          <MessageSquare size={13} className="text-[var(--m-text-muted)] flex-shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] truncate text-[var(--m-text-primary)]">{conv.title}</p>
            <p className="text-[10px] text-[var(--m-text-muted)]">{formatTimestamp(conv.updatedAt)}</p>
          </div>
        </>
      )}
      {!isEditing && (
        <button onClick={(e) => { e.stopPropagation(); onToggleMenu(); }} className={cn('p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity', menuOpen && 'opacity-100', 'hover:bg-white/[0.06] text-[var(--m-text-muted)]')}>
          <Sparkles size={11} strokeWidth={1.5} />
        </button>
      )}
      {menuOpen && (
        <div ref={menuRef} className="absolute right-0 top-full mt-1 z-50 w-36 py-1 rounded-xl border border-white/[0.06] bg-[var(--m-bg-elevated)] shadow-xl">
          <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--m-text-primary)] hover:bg-white/[0.04]"><Pin size={12} strokeWidth={1.5} />{conv.pinned ? 'Unpin' : 'Pin'}</button>
          <button onClick={(e) => { e.stopPropagation(); onStartEdit(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--m-text-primary)] hover:bg-white/[0.04]"><Pencil size={12} strokeWidth={1.5} />Rename</button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--m-text-primary)] hover:bg-white/[0.04]"><Copy size={12} strokeWidth={1.5} />Duplicate</button>
          <div className="my-1 border-t border-white/[0.04]" />
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--m-accent-red)] hover:bg-white/[0.04]"><Trash2 size={12} strokeWidth={1.5} />Delete</button>
        </div>
      )}
    </div>
  );
}
