import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export function FilePreviewLoadingState() {
  const t = useTranslations('FilePreview');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span>{t('loadingFileInformation')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
