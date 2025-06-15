import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FilePreviewLayout } from './FilePreviewLayout';

export function FilePreviewNoFileState() {
  const t = useTranslations('Stats');

  return (
    <FilePreviewLayout>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">{t('fileInformationNotAvailable')}</p>
          </CardContent>
        </Card>
      </div>
    </FilePreviewLayout>
  );
}
