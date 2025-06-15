import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { getFileIcon, getFileTypeLabel } from '../utils/fileUtils';
import type { ClientFileData } from '@/types';
import { useTranslations } from 'next-intl';

interface FilePreviewHeaderProps {
  fileInfo: ClientFileData;
  isExpired: boolean;
}

export function FilePreviewHeader({
  fileInfo,
  isExpired,
}: FilePreviewHeaderProps) {
  const IconComponent = getFileIcon(fileInfo.mimeType);
  const t = useTranslations('Files');

  return (
    <CardHeader>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
          <IconComponent className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
            {fileInfo.originalName}
          </CardTitle>
          <CardDescription className="mt-2 flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {getFileTypeLabel(fileInfo.mimeType)}
            </Badge>
            {isExpired && (
              <Badge
                variant="destructive"
                className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              >
                <AlertCircle className="mr-1 h-3 w-3" />
                {t('expired')}
              </Badge>
            )}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}
