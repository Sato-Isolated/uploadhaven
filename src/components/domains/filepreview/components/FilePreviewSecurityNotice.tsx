import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FilePreviewSecurityNotice() {
  const t = useTranslations('FilePreview');

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="font-medium text-green-800">
          {t('secureDownload')}
        </span>
      </div>
      <p className="mt-1 text-sm text-green-700">{t('fileScannedSafe')}</p>
    </div>
  );
}
