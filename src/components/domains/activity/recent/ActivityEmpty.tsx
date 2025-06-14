'use client';

import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ActivityEmpty() {
  const t = useTranslations('Activity');

  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      <Activity className="mx-auto mb-4 h-16 w-16 opacity-30" />
      <p className="text-lg font-medium">{t('noActivitiesFound')}</p>
      <p className="mt-1 text-sm">{t('activityWillAppear')}</p>
    </div>
  );
}
