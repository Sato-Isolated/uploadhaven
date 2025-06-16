'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import ActivityFilters from '../recent/ActivityFilters';

interface ActivityHeaderProps {
  realtimeConnected: boolean;
  activityCount: number;
  typeFilter: string;
  severityFilter: string;
  onTypeFilterChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
}

export default function ActivityHeader({
  realtimeConnected,
  activityCount,
  typeFilter,
  severityFilter,
  onTypeFilterChange,
  onSeverityFilterChange,
}: ActivityHeaderProps) {
  const t = useTranslations('Activity');

  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
          {t('recentActivity')}
        </span>

        {/* Real-time connection indicator */}
        <div className="ml-auto flex items-center gap-2">
          {activityCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-red-500 px-2 py-1 text-xs text-white"
            >
              {t('newActivitiesCount', { count: activityCount })}
            </motion.div>
          )}
          <motion.div
            className="flex items-center gap-1 text-xs"
            animate={{ opacity: realtimeConnected ? 1 : 0.5 }}
          >
            {realtimeConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {t('live')}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">{t('offline')}</span>
              </>
            )}
          </motion.div>
        </div>
      </CardTitle>

      <ActivityFilters
        typeFilter={typeFilter}
        severityFilter={severityFilter}
        onTypeFilterChange={onTypeFilterChange}
        onSeverityFilterChange={onSeverityFilterChange}
      />
    </CardHeader>
  );
}
