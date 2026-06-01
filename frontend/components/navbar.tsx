'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, LogOut, ClipboardList, Flame, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { useThemeStore } from '@/lib/theme-store';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const { isDark, toggle } = useThemeStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = user?.role === 'ADMIN';
  const isPublicPage = ['/login', '/register'].includes(pathname);

  if (isPublicPage) return null;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={isAdmin ? '/admin' : '/'}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-stone-900 dark:text-stone-50 tracking-tight">
            Dev<span className="text-red-600">Food</span>
          </span>
          {isAdmin && (
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          )}
        </Link>

        <div className="flex items-center gap-0.5">
          {user && (
            <>
              <span className="text-sm text-stone-500 dark:text-stone-400 hidden sm:block mr-3 font-medium">
                Olá, {user.name.split(' ')[0]}
              </span>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:block">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/orders"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span className="hidden sm:block">Pedidos</span>
                  </Link>
                  <button
                    onClick={toggleCart}
                    className="relative p-2 text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg"
                    aria-label="Abrir carrinho"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={toggle}
            className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg"
            aria-label="Alternar modo escuro"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="p-2 text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
