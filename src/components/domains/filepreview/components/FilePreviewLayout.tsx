'use client';

import { useTranslations } from 'next-intl';
import { FilePreviewNavigation } from './FilePreviewNavigation';

interface FilePreviewLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function FilePreviewLayout({ children, showHeader = true }: FilePreviewLayoutProps) {
  const tHome = useTranslations('Home');
  const t = useTranslations('FilePreview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-2xl pt-8">
        {/* Navigation */}
        <FilePreviewNavigation />
        
        {/* Header */}
        {showHeader && (
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              {tHome('title')}
            </h1>
            <p className="text-gray-600">{t('filePreviewAndDownload')}</p>
          </div>
        )}

        {children}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{t('poweredByUploadHaven')}</p>
        </div>
      </div>
    </div>
  );
}
