'use client';

import { useTranslations } from 'next-intl';
import { FilePreviewNavigation } from './FilePreviewNavigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import LanguageSwitcher from '@/components/domains/language/LanguageSwitcher';

interface FilePreviewLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function FilePreviewLayout({
  children,
  showHeader = true,
}: FilePreviewLayoutProps) {
  const tHome = useTranslations('Home');
  const t = useTranslations('FilePreview');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">      <div className="mx-auto max-w-6xl pt-8">
        {/* Top navigation and controls */}
        <div className="mb-6 flex items-center justify-between">
          <FilePreviewNavigation />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        {/* Header */}
        {showHeader && (
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {tHome('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('filePreviewAndDownload')}
            </p>
          </div>
        )}
        {children} {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('poweredByUploadHaven')}</p>
        </div>
      </div>
    </div>
  );
}
