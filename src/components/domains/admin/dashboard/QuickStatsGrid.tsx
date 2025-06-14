'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, HardDrive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminDashboardProps } from './types';

interface QuickStatsGridProps {
  stats: AdminDashboardProps['stats'];
}

export default function QuickStatsGrid({ stats }: QuickStatsGridProps) {
  const t = useTranslations('Admin');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {t('totalFiles')}
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {stats.totalFiles.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              {t('todayUploads', { count: stats.todayUploads })}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 dark:border-emerald-800 dark:from-emerald-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t('totalUsers')}
            </CardTitle>
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              {t('activeThisWeek', { count: stats.activeUsers })}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-100 dark:border-purple-800 dark:from-purple-950 dark:to-violet-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {t('storageUsed')}
            </CardTitle>
            <HardDrive className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {stats.totalStorage}
            </div>
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
              {t('acrossAllFiles')}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
