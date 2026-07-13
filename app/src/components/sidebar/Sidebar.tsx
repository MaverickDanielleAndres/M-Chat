import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Pin,
  Copy,
  X,
  MessageSquare,
  Settings,
  Share2,
  Archive,
  LogOut,
  LogIn,
  ChevronLeft,
  PanelLeft,
  MoreVertical,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { cn, formatTimestamp } from '@/lib/utils';
import { useNavigate } from 'react-router';
import type { Conversation } from '@/types';

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED = 0;

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    searchQuery,
    wallet,
    isAuthed,
    profile,
    createConversation,
    setActiveConversation,
    deleteConversation,
    renameConversation,
    pinConversation,
    duplicateConversation,
    toggleSidebar,
    setSidebarOpen,
    setSearchQuery,
    toggleSettings,
    addToast,
  } = useStore();

  const { signOut, user } = useSupabaseAuth();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = searchQuery.toLowerCase();
  const filtered = conversations
    .filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  const pinned = filtered.filter((c) => c.pinned);
  const recent = filtered.filter((c) => !c.pinned);

  const handleNewChat = async () => {
    await createConversation();
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    addToast({ type: 'info', message: 'Signed out' });
    navigate('/');
  };

  const unlimited = wallet.daily_quota === -1;
  const atLimit = !unlimited && wallet.daily_used >= wallet.daily_quota;
  const tier = (profile?.subscription_tier as string) ?? 'free';
  const tierBadge =
    tier === 'pro'
      ? 'Pro'
      : tier === 'premium'
      ? 'Premium'
      : tier === 'admin'
      ? 'Admin'
      : tier === 'developer'
      ? 'Dev'
      : 'Free';

  // Collapsed rail — shows menu button, + new chat, conversation list, settings
  if (!sidebarOpen) {
    const recentCollapsed = filtered.slice(0, 8);
    return (
      <aside
        className={cn(
          'hidden lg:flex flex-col w-14 flex-shrink-0',
          'border-r border-border bg-card/95 backdrop-blur-sm'
        )}
      >
        {/* Header: expand toggle */}
        <div className="flex items-center justify-center h-12 border-b border-border flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat icon button */}
        <div className="flex items-center justify-center py-2">
          <button
            onClick={handleNewChat}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-lg transition-all',
              'bg-gradient-to-br from-indigo-500 to-violet-600 text-white',
              'hover:from-indigo-600 hover:to-violet-700 shadow-sm shadow-indigo-500/20'
            )}
            aria-label="New chat"
            title="New chat"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Conversation list — icon only with title tooltip */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-0.5 py-1 px-1.5">
          {recentCollapsed.map((c) => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(c.id);
              }}
              title={c.title}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0',
                activeConversationId === c.id
                  ? 'bg-muted/60 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {c.pinned
                ? <Pin size={13} className="text-indigo-400" />
                : <MessageSquare size={13} />}
            </button>
          ))}
        </div>

        {/* Settings at bottom */}
        <div className="border-t border-border flex items-center justify-center py-2 flex-shrink-0">
          <button
            onClick={toggleSettings}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: SIDEBAR_WIDTH }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        style={{ width: SIDEBAR_WIDTH }}
        className={cn(
          'fixed lg:relative left-0 top-0 bottom-0 z-50 flex flex-col',
          'border-r border-border bg-card/95 backdrop-blur-md',
          'w-[280px] flex-shrink-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-12 border-b border-border flex-shrink-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group min-w-0">
            <img src="/logonobg.png" alt="M-Chat" className="w-7 h-7 rounded-md flex-shrink-0" />
            <span className="font-semibold text-sm tracking-tight truncate">M-Chat</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-medium hidden sm:inline">
              {tierBadge}
            </span>
          </button>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New chat */}
        <div className="px-3 py-2">
          <button
            onClick={handleNewChat}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[13px] font-medium',
              'bg-gradient-to-br from-indigo-500 to-violet-600 text-white',
              'hover:from-indigo-600 hover:to-violet-700 transition-all',
              'shadow-sm shadow-indigo-500/20'
            )}
          >
            <Plus size={14} strokeWidth={2} /> New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              data-search-input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-7 pr-7 py-1.5 text-[12px] rounded-lg',
                'bg-muted/40 text-foreground placeholder:text-muted-foreground',
                'border border-border outline-none',
                'focus:border-indigo-500/40 focus:bg-background transition-colors'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={11} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
          <Section
            title="Pinned"
            items={pinned}
            activeConversationId={activeConversationId}
            editingId={editingId}
            editValue={editValue}
            menuOpenId={menuOpenId}
            onSelect={handleSelect}
            onStartEdit={(id, title) => {
              setEditingId(id);
              setEditValue(title);
              setMenuOpenId(null);
            }}
            onChangeEditValue={setEditValue}
            onFinishEdit={() => setEditingId(null)}
            onToggleMenu={(id) => setMenuOpenId(menuOpenId === id ? null : id)}
            onCloseMenu={() => setMenuOpenId(null)}
            onPin={pinConversation}
            onRename={renameConversation}
            onDuplicate={duplicateConversation}
            onAskDelete={(id) => {
              setMenuOpenId(null);
              setConfirmDeleteId(id);
            }}
            editRef={editRef}
            menuRef={menuRef}
          />
          <Section
            title={searchQuery ? 'Results' : 'Recent'}
            items={recent}
            activeConversationId={activeConversationId}
            editingId={editingId}
            editValue={editValue}
            menuOpenId={menuOpenId}
            onSelect={handleSelect}
            onStartEdit={(id, title) => {
              setEditingId(id);
              setEditValue(title);
              setMenuOpenId(null);
            }}
            onChangeEditValue={setEditValue}
            onFinishEdit={() => setEditingId(null)}
            onToggleMenu={(id) => setMenuOpenId(menuOpenId === id ? null : id)}
            onCloseMenu={() => setMenuOpenId(null)}
            onPin={pinConversation}
            onRename={renameConversation}
            onDuplicate={duplicateConversation}
            onAskDelete={(id) => {
              setMenuOpenId(null);
              setConfirmDeleteId(id);
            }}
            editRef={editRef}
            menuRef={menuRef}
          />
          {recent.length === 0 && pinned.length === 0 && (
            <div className="text-center py-10 px-3">
              <MessageSquare className="w-7 h-7 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[12px] text-muted-foreground">
                {searchQuery ? 'No chats match your search' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleNewChat}
                  className="mt-2 text-[11px] text-indigo-400 hover:underline"
                >
                  Start your first chat
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2.5 space-y-2 flex-shrink-0">
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">{unlimited ? 'Daily' : 'Free prompts'}</span>
              <span
                className={cn(
                  'font-mono font-medium',
                  atLimit
                    ? 'text-red-400'
                    : !unlimited && wallet.daily_used >= wallet.daily_quota * 0.8
                    ? 'text-amber-400'
                    : 'text-foreground'
                )}
              >
                {unlimited ? '∞' : `${wallet.daily_used}/${wallet.daily_quota}`}
              </span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  atLimit
                    ? 'bg-red-500'
                    : !unlimited && wallet.daily_used >= wallet.daily_quota * 0.8
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                )}
                animate={{
                  width: unlimited
                    ? '100%'
                    : `${Math.min((wallet.daily_used / Math.max(1, wallet.daily_quota)) * 100, 100)}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span>Balance: {wallet.balance}</span>
              {(tier === 'free' || tier === 'registered') ? (
                <button
                  onClick={() =>
                    addToast({ type: 'info', message: 'Upgrade flow coming soon' })
                  }
                  className="text-indigo-400 hover:underline"
                >
                  Upgrade
                </button>
              ) : (
                <span className="text-indigo-400">{tierBadge} plan</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={toggleSettings}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-3 h-3" /> Settings
            </button>
            {isAuthed ? (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="w-3 h-3" /> Sign out
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogIn className="w-3 h-3" /> Log in
              </button>
            )}
          </div>

          {isAuthed && user && (
            <div className="flex items-center gap-2 px-1.5 py-1 rounded-lg bg-muted/30">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                {(profile?.display_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium truncate">
                  {profile?.display_name ?? user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Delete conversation?</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    This will permanently remove this chat. Cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-1.5 rounded-lg text-[12px] border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const id = confirmDeleteId;
                    setConfirmDeleteId(null);
                    await deleteConversation(id);
                    addToast({ type: 'success', message: 'Conversation deleted' });
                  }}
                  className="flex-1 py-1.5 rounded-lg text-[12px] bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
interface SectionProps {
  title: string;
  items: Conversation[];
  activeConversationId: string | null;
  editingId: string | null;
  editValue: string;
  menuOpenId: string | null;
  onSelect: (id: string) => void;
  onStartEdit: (id: string, title: string) => void;
  onChangeEditValue: (v: string) => void;
  onFinishEdit: () => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onPin: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onAskDelete: (id: string) => void;
  editRef: React.RefObject<HTMLInputElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

function Section({ title, items, ...rest }: SectionProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((c) => (
          <ConvItem key={c.id} conv={c} {...rest} title={title} items={items} />
        ))}
      </div>
    </div>
  );
}

interface ConvItemProps extends SectionProps {
  conv: Conversation;
}

function ConvItem({
  conv,
  activeConversationId,
  editingId,
  editValue,
  menuOpenId,
  onSelect,
  onStartEdit,
  onChangeEditValue,
  onFinishEdit,
  onToggleMenu,
  onCloseMenu,
  onPin,
  onRename,
  onDuplicate,
  onAskDelete,
  editRef,
  menuRef,
}: ConvItemProps) {
  const isActive = conv.id === activeConversationId;
  const isEditing = editingId === conv.id;
  const menuOpen = menuOpenId === conv.id;
  const addToast = useStore((s) => s.addToast);

  const handleShare = async () => {
    onCloseMenu();
    const url = `${window.location.origin}/#/chat?c=${conv.id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast({ type: 'success', message: 'Link copied to clipboard' });
    } catch {
      addToast({ type: 'info', message: url });
    }
  };

  const handleArchive = () => {
    onCloseMenu();
    addToast({ type: 'info', message: 'Archive coming soon' });
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-muted/60' : 'hover:bg-muted/40'
      )}
      onClick={() => {
        if (!isEditing && !menuOpen) onSelect(conv.id);
      }}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-full bg-indigo-500" />
      )}
      {conv.pinned && (
        <Pin size={10} className="text-indigo-400 flex-shrink-0" strokeWidth={2} />
      )}
      {isEditing ? (
        <input
          ref={editRef}
          value={editValue}
          onChange={(e) => onChangeEditValue(e.target.value)}
          onBlur={() => {
            if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
            onFinishEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
              onFinishEdit();
            }
            if (e.key === 'Escape') {
              onChangeEditValue(conv.title);
              onFinishEdit();
            }
          }}
          className="flex-1 text-[12px] bg-transparent outline-none border-b border-indigo-500 text-foreground"
        />
      ) : (
        <>
          <MessageSquare size={12} className="text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] truncate text-foreground">{conv.title}</p>
            <p className="text-[10px] text-muted-foreground">{formatTimestamp(conv.updatedAt)}</p>
          </div>
        </>
      )}
      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu(conv.id);
          }}
          className={cn(
            'p-1 rounded-md transition-colors flex-shrink-0',
            menuOpen
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          aria-label="Conversation actions"
          title="More actions"
        >
          <MoreVertical size={14} strokeWidth={1.75} />
        </button>
      )}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 z-50 w-36 py-1 rounded-xl border border-border bg-popover shadow-xl"
        >
          <MenuButton
            icon={Pin}
            label={conv.pinned ? 'Unpin' : 'Pin'}
            onClick={() => {
              onPin(conv.id);
              onCloseMenu();
            }}
          />
          <MenuButton
            icon={Pencil}
            label="Rename"
            onClick={() => onStartEdit(conv.id, conv.title)}
          />
          <MenuButton
            icon={Copy}
            label="Duplicate"
            onClick={() => {
              onDuplicate(conv.id);
              onCloseMenu();
            }}
          />
          <MenuButton icon={Share2} label="Share" onClick={handleShare} />
          <MenuButton icon={Archive} label="Archive" onClick={handleArchive} />
          <div className="my-1 border-t border-border" />
          <MenuButton
            icon={Trash2}
            label="Delete"
            destructive
            onClick={() => onAskDelete(conv.id)}
          />
        </div>
      )}
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] hover:bg-muted/60 transition-colors',
        destructive ? 'text-red-400 hover:bg-red-500/10' : 'text-foreground'
      )}
    >
      <Icon size={11} strokeWidth={1.5} />
      {label}
    </button>
  );
}

// re-export so ChatWorkspace can use the same width constant
export const SIDEBAR_WIDTHS = { open: SIDEBAR_WIDTH, collapsed: SIDEBAR_COLLAPSED };