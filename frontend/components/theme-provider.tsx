'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark, init } = useThemeStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return <>{children}</>;
}
