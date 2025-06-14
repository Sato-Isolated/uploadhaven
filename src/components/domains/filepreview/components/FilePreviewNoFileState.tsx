import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FilePreviewNoFileState() {
  const t = useTranslations('Stats');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-600">{t('fileInformationNotAvailable')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
