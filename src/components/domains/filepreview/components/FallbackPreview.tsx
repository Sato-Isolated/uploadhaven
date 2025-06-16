'use client';

import { useTranslations } from 'next-intl';

export default function FallbackPreview() {
  const t = useTranslations('FilePreview');

  return (
    <div className="space-y-4 text-center">
      <div className="text-6xl text-gray-300">📄</div>
      <div className="text-gray-600">{t('previewNotAvailable')}</div>
      <div className="text-muted-foreground text-sm">
        {t('useDownloadButton')}
      </div>
    </div>
  );
}
