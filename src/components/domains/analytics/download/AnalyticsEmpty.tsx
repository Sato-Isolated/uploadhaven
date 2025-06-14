'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

interface AnalyticsEmptyProps {
  className?: string;
}

export default function AnalyticsEmpty({
  className = '',
}: AnalyticsEmptyProps) {
  const t = useTranslations('Common');
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-muted-foreground text-center">
        {t('noAnalyticsData')}
      </div>
    </Card>
  );
}
