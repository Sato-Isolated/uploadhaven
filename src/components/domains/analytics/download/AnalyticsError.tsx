'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AnalyticsErrorProps {
  error: string;
  onRetry: () => void;
  className?: string;
}

export default function AnalyticsError({
  error,
  onRetry,
  className = '',
}: AnalyticsErrorProps) {
  const t = useTranslations('Common');

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4 text-center">
        <div className="text-red-500">{t('errorLoadingAnalytics')}</div>
        <div className="text-muted-foreground text-sm">{error}</div>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('retry')}
        </Button>
      </div>
    </Card>
  );
}
