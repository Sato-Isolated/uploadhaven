import { Button } from '@/components/ui/button';
import { Download, Share2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FilePreviewActionsProps {
  isExpired: boolean;
  downloading: boolean;
  onDownload: () => Promise<void>;
  onCopyShareLink: () => void;
  // Zero-Knowledge decryption support
  hasDecryptionKey?: boolean;
  isDecrypting?: boolean;
  onDecryptedDownload?: () => Promise<void>;
}

export function FilePreviewActions({
  isExpired,
  downloading,
  onDownload,
  onCopyShareLink,
  hasDecryptionKey = false,
  isDecrypting = false,
  onDecryptedDownload,
}: FilePreviewActionsProps) {
  const t = useTranslations('FilePreview');
  return (
    <div className="space-y-3">
      {!isExpired ? (
        <>
          {/* Download button - prioritize decrypted download for ZK files */}
          {hasDecryptionKey && onDecryptedDownload ? (
            <Button
              onClick={onDecryptedDownload}
              disabled={isDecrypting || downloading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              {isDecrypting ? 'Decrypting...' : t('downloadFile')}
            </Button>
          ) : (
            <Button
              onClick={onDownload}
              disabled={downloading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              {downloading ? t('startingDownload') : t('downloadFile')}
            </Button>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-600 dark:text-red-400" />
          <p className="font-medium text-red-800 dark:text-red-200">
            {t('fileExpired')}
          </p>
          <p className="text-sm text-red-600 dark:text-red-300">
            {t('downloadNoLongerAvailable')}
          </p>
        </div>
      )}
      <Button
        onClick={onCopyShareLink}
        variant="outline"
        className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        size="lg"
      >
        <Share2 className="mr-2 h-5 w-5" />
        {t('copyShareLink')}
      </Button>
    </div>
  );
}
