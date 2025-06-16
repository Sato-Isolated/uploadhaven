'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

export function AnalyticsEmptyState() {
  const t = useTranslations('Admin');

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-gray-500">{t('noAnalyticsData')}</p>
      </CardContent>
    </Card>
  );
}
