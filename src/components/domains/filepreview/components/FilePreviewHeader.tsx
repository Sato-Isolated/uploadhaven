import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { getFileIcon, getFileTypeLabel } from '../utils/fileUtils';
import type { ClientFileData } from '@/types';

interface FilePreviewHeaderProps {
  fileInfo: ClientFileData;
  isExpired: boolean;
}

export function FilePreviewHeader({
  fileInfo,
  isExpired,
}: FilePreviewHeaderProps) {
  const IconComponent = getFileIcon(fileInfo.mimeType);

  return (
    <CardHeader>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 text-blue-600">
          <IconComponent className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-xl font-semibold">
            {fileInfo.originalName}
          </CardTitle>{' '}
          <CardDescription className="mt-2 flex items-center space-x-2">
            <Badge variant="secondary">
              {getFileTypeLabel(fileInfo.mimeType)}
            </Badge>
            {isExpired && (
              <Badge variant="destructive">
                <AlertCircle className="mr-1 h-3 w-3" />
                Expired
              </Badge>
            )}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}
