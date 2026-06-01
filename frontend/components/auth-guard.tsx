'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
    setReady(true);
  }, [init]);

  useEffect(() => {
    if (!ready) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublic) {
      router.replace('/login');
      return;
    }

    if (user && isPublic) {
      router.replace(user.role === 'ADMIN' ? '/admin' : '/');
    }
  }, [ready, user, pathname, router]);

  if (!ready) return null;

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  if (!user && !isPublic) return null;

  return <>{children}</>;
}
