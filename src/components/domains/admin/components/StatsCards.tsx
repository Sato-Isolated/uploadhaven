'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Files, 
  HardDrive, 
  Upload, 
  Download, 
  Activity,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import type { AdminStats } from '@/types/admin';

interface StatsCardsProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  isLoading: boolean;
  gradient: string;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  isLoading, 
  gradient 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}    >      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
        <div className={`h-2 ${gradient} group-hover:h-3 transition-all duration-300`} />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
            <span>{title}</span>
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
              {trend !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  {trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 dark:text-green-400" />
                  ) : trend < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-500 dark:text-red-400" />
                  ) : null}
                  <span className={trend > 0 ? 'text-green-600 dark:text-green-400' : trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const t = useTranslations('Admin');

  const cards = [
    {
      title: t('totalFiles'),
      value: stats?.totalFiles || 0,
      subtitle: t('filesInSystem'),
      icon: Files,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      title: t('totalUsers'),
      value: stats?.totalUsers || 0,
      subtitle: `${stats?.activeUsers || 0} ${t('activeUsers')}`,
      icon: Users,
      gradient: 'bg-gradient-to-r from-green-500 to-green-600',
    },
    {
      title: t('totalStorage'),
      value: stats?.totalStorage || '0 Bytes',
      subtitle: t('storageUsed'),
      icon: HardDrive,
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
    },
    {
      title: t('todayUploads'),
      value: stats?.todayUploads || 0,
      subtitle: t('filesUploadedToday'),
      icon: Upload,
      gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
    {
      title: t('totalDownloads'),
      value: stats?.totalDownloads || 0,
      subtitle: t('allTimeDownloads'),
      icon: Download,
      gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    },
    {
      title: t('systemHealth'),      value: stats?.systemHealth === 'healthy' ? t('healthy') : 
             stats?.systemHealth === 'warning' ? t('warning') : t('error'),
      subtitle: t('systemStatus'),
      icon: Activity,
      gradient: stats?.systemHealth === 'healthy' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                stats?.systemHealth === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                'bg-gradient-to-r from-red-500 to-red-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          isLoading={isLoading}
          gradient={card.gradient}
        />
      ))}
    </div>
  );
}
