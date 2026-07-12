import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function useKeyboardShortcuts() {
  const { toggleSidebar, createConversation, toggleSettings } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Ctrl/Cmd + N: New chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createConversation();
      }

      // Ctrl/Cmd + B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl/Cmd + ,: Toggle settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }

      // Escape: Close dialogs
      if (e.key === 'Escape') {
        const dialogs = document.querySelectorAll('[data-dialog]');
        dialogs.forEach((d) => {
          (d as HTMLElement).dispatchEvent(new CustomEvent('close-dialog'));
        });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar, createConversation, toggleSettings]);
}
