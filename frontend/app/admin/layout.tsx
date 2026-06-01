'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Tag, Package } from 'lucide-react';

const tabs = [
  { href: '/admin', label: 'Pedidos', icon: ClipboardList, exact: true },
  { href: '/admin/categories', label: 'Categorias', icon: Tag },
  { href: '/admin/products', label: 'Produtos', icon: Package },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400'
                      : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
