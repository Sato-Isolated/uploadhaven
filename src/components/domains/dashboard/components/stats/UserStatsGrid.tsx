// UserStatsGrid following SRP principles
// Responsibility: Container for user statistics cards

'use client';

import { motion } from 'motion/react';
import type { UserStatsGridProps } from '../../types';
import { UserStatCard } from './UserStatCard';
import { StatsLoadingState } from './StatsLoadingState';
import { StatsErrorState } from './StatsErrorState';
import { formatFileSize } from '@/lib/core/utils';
import {
  Database,
  HardDrive,
  Upload,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export function UserStatsGrid({ 
  stats, 
  isLoading = false, 
  statsError = null,
  className = '' 
}: UserStatsGridProps) {
  const t = useTranslations('Stats');

  if (isLoading) {
    return <StatsLoadingState />;
  }

  if (statsError) {
    return <StatsErrorState error={statsError} />;
  }

  const statCards = [
    {
      title: t('totalFiles'),
      value: stats.totalFiles.toLocaleString(),
      icon: Database,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
    },
    {
      title: t('totalSize'),
      value: formatFileSize(stats.totalSize),
      icon: HardDrive,
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950',
    },
    {
      title: t('recentUploads'),
      value: stats.recentUploads,
      subtitle: t('last7Days'),
      icon: Upload,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
    },
    {
      title: t('expiringSoon'),
      value: stats.expiringSoon,
      subtitle: t('next24Hours'),
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950',
    },
  ];

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <UserStatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            gradient={stat.gradient}
            bgGradient={stat.bgGradient}
            delay={index * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
}
