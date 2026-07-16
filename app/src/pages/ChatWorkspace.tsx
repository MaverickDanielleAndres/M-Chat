import { useEffect, lazy, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { LimitModal } from '@/components/modals/LimitModal';
import { ToastSystem } from '@/components/ui/ToastSystem';
import { Footer } from '@/components/ui/Footer';
import { useSearchParams } from 'react-router';

// DeveloperPanel pulls in recharts (~250kB). Lazy-load it so the main chat
// bundle stays small.
const DeveloperPanel = lazy(() =>
  import('@/components/ui/DeveloperPanel').then((m) => ({ default: m.DeveloperPanel }))
);

let isCreatingOnMount = false;

export function ChatWorkspace() {
  const { createConversation, bootstrap, toggleSettings } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  useTheme();
  useKeyboardShortcuts();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (searchParams.get('settings') === '1') {
      toggleSettings();
      const next = new URLSearchParams(searchParams);
      next.delete('settings');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (useStore.getState().conversations.length === 0 && !isCreatingOnMount) {
      isCreatingOnMount = true;
      void createConversation().finally(() => {
        setTimeout(() => {
          isCreatingOnMount = false;
        }, 1000);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        <div className="flex-1 flex flex-col min-h-0">
          <ChatArea />
        </div>
        <Footer />
      </div>
      <SettingsModal />
      <LimitModal />
      <ToastSystem />
      <Suspense fallback={null}>
        <DeveloperPanel />
      </Suspense>
    </div>
  );
}