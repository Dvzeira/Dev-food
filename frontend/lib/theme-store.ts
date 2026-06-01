import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
      return { isDark: next };
    }),
  init: () => {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      set({ isDark: saved ? saved === 'dark' : prefersDark });
    } catch {}
  },
}));
