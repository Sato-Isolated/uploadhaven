'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalyticsErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function AnalyticsErrorState({
  error,
  onRetry,
}: AnalyticsErrorStateProps) {
  const t = useTranslations('Admin');
  
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <p className="text-red-600">{t('analyticsError', { message: error.message })}</p>
        <Button onClick={onRetry} className="mt-4" variant="outline">
          {t('retry')}
        </Button>
      </CardContent>
    </Card>
  );
}
