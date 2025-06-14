'use client';

import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { SystemStatusProps } from '../types';
import { useTranslations } from 'next-intl';

export default function SystemStatus({ stats }: SystemStatusProps) {
  const t = useTranslations('Stats');

  const statusBadges = [
    {
      condition: stats.totalFiles > 0,
      variant: stats.totalFiles > 0 ? 'default' : 'secondary',
      text: stats.totalFiles > 0 ? t('filesAvailable') : t('noFiles'),
    },
    {
      condition: stats.last24hUploads > 0,
      variant: stats.last24hUploads > 0 ? 'default' : 'secondary',
      text:
        stats.last24hUploads > 0
          ? `${stats.last24hUploads} ${t('recentUploads')}`
          : t('noRecentActivity'),
    },
    {
      condition: true,
      variant: 'outline',
      text:
        stats.totalSizeBytes > 50 * 1024 * 1024
          ? t('highUsage')
          : t('normalUsage'),
    },
    {
      condition: true,
      variant: stats.last7dUploads > 10 ? 'destructive' : 'default',
      text: `${stats.last7dUploads} ${t('uploadsThisWeek')}`,
    },
  ];

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.5 }}
    >
      <h3 className="text-lg font-medium">{t('systemStatus')}</h3>
      <div className="flex flex-wrap gap-2">
        {statusBadges.map((badge, index) => (
          <motion.div
            key={`status-badge-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6 + index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <Badge
              variant={
                badge.variant as
                  | 'default'
                  | 'secondary'
                  | 'outline'
                  | 'destructive'
                  | null
                  | undefined
              }
            >
              {badge.text}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
