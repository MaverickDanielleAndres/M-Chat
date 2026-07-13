import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

/**
 * Applies the user's UI preferences to the document:
 *   - `.dark` / `.light` on `<html>` for theme switching
 *   - data-font-size / data-font-family / data-density for CSS hooks
 *   - --accent-color CSS var from settings.accentColor
 */
export function useTheme() {
  const { settings } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (mode: 'light' | 'dark') => {
      root.classList.toggle('dark', mode === 'dark');
      root.classList.toggle('light', mode === 'light');
      root.style.colorScheme = mode;
    };

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = settings.fontSize;
    root.dataset.fontFamily = settings.fontFamily;
    root.dataset.density = settings.density;
  }, [settings.fontSize, settings.fontFamily, settings.density]);

  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    }
  }, [settings.accentColor]);

  return { theme: settings.theme, settings };
}