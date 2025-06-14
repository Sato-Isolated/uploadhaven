import { HardDrive, Eye, Calendar } from 'lucide-react';
import { formatFileSize } from '../utils/fileUtils';
import type { ClientFileData } from '@/types';
import { useTranslations } from 'next-intl';

interface FilePreviewDetailsProps {
  fileInfo: ClientFileData;
  isExpired: boolean;
}

export function FilePreviewDetails({
  fileInfo,
  isExpired,
}: FilePreviewDetailsProps) {
  const t = useTranslations('FilePreview');

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm">
          <HardDrive className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">{t('sizeLabel')}</span>
          <span className="font-medium">{formatFileSize(fileInfo.size)}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Eye className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">{t('downloadsLabel')}</span>
          <span className="font-medium">{fileInfo.downloadCount}</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">{t('uploadedLabel')}</span>
          <span className="font-medium">
            {new Date(fileInfo.uploadDate).toLocaleDateString()}
          </span>
        </div>
        {fileInfo.expiresAt && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{t('expiresLabel')}</span>
            <span className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
              {new Date(fileInfo.expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
