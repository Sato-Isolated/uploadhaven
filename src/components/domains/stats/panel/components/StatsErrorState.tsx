'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export default function StatsErrorState() {
  const t = useTranslations('Stats');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('serverStatistics')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-destructive text-sm">
          {t('failedToLoadStatistics')}
        </div>
      </CardContent>
    </Card>
  );
}
