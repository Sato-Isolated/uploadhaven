import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { PrefetchProvider } from '@/components/providers/PrefetchProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { NavigationSSEManager } from '@/components/domains/notifications/NavigationSSEManager';
import { QueryErrorBoundary } from '@/components/domains/ui/QueryErrorBoundary';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { routing } from '@/i18n/routing';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <div 
      lang={locale} 
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <ThemeProvider>
        <QueryProvider>
          <NotificationProvider>
            <NavigationSSEManager />
            <PrefetchProvider>
              <NextIntlClientProvider messages={messages} locale={locale}>
                <QueryErrorBoundary>{children}</QueryErrorBoundary>
              </NextIntlClientProvider>
            </PrefetchProvider>
          </NotificationProvider>
          <Toaster />
        </QueryProvider>
      </ThemeProvider>
    </div>
  );
}
