'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  title?: string;
  description?: string;
}

export function AnalyticsHeader({
  timeRange,
  onTimeRangeChange,
  title,
  description,
}: AnalyticsHeaderProps) {
  const t = useTranslations('Admin');
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title || t('adminAnalyticsTitle')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {description || t('adminAnalyticsDescription')}
        </p>
      </div>
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">{t('timeRange7Days')}</SelectItem>
          <SelectItem value="30d">{t('timeRange30Days')}</SelectItem>
          <SelectItem value="90d">{t('timeRange90Days')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
