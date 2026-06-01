import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { CartDrawer } from '@/components/cart-drawer';
import { AuthGuard } from '@/components/auth-guard';
import { ThemeProvider } from '@/components/theme-provider';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dev Food — Delivery',
  description: 'Peça sua comida favorita com rapidez',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${dmSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-stone-50 dark:bg-neutral-950 antialiased">
        <ThemeProvider>
          <AuthGuard>
            <Navbar />
            <CartDrawer />
            <main className="flex-1">{children}</main>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
