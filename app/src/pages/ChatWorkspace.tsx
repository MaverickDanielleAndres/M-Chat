import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { LimitModal } from '@/components/modals/LimitModal';
import { ToastSystem } from '@/components/ui/ToastSystem';
import { DeveloperPanel } from '@/components/ui/DeveloperPanel';
import { Footer } from '@/components/ui/Footer';

export function ChatWorkspace() {
  const { sidebarOpen, createConversation, conversations } = useStore();

  useTheme();
  useKeyboardShortcuts();

  useEffect(() => {
    if (conversations.length === 0) {
      createConversation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      <Sidebar />
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-0' : 'lg:-ml-[280px]'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <ChatArea />
        </div>
        <Footer />
      </div>
      <SettingsModal />
      <LimitModal />
      <ToastSystem />
      <DeveloperPanel />
    </div>
  );
}
