'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatFileSize } from '@/lib/utils';
import { Database, HardDrive, TrendingUp, Users } from 'lucide-react';
import type { AdminFileData } from '@/types';
import type { Statistic } from '../types';
import { useTranslations } from 'next-intl';

interface StatisticsGridProps {
  files: AdminFileData[];
}

export default function StatisticsGrid({ files }: StatisticsGridProps) {
  const t = useTranslations('Admin');

  const statistics: Statistic[] = [
    {
      title: t('totalFiles'),
      value: files.length,
      icon: Database,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
    },
    {
      title: t('totalSize'),
      value: formatFileSize(
        files.reduce((total, file) => total + file.size, 0)
      ),
      icon: HardDrive,
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient:
        'from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950',
    },
    {
      title: t('totalDownloads'),
      value: files.reduce((total, file) => total + file.downloadCount, 0),
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient:
        'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
    },
    {
      title: t('anonymousFiles'),
      value: files.filter((file) => file.isAnonymous).length,
      icon: Users,
      gradient: 'from-orange-500 to-red-500',
      bgGradient:
        'from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statistics.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card
              className={`border-0 bg-gradient-to-br shadow-lg ${stat.bgGradient} backdrop-blur-sm`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="font-medium text-gray-600 dark:text-gray-300">
                    {stat.title}
                  </CardDescription>
                  <motion.div
                    className={`bg-gradient-to-br p-2 ${stat.gradient} rounded-lg shadow-md`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <IconComponent className="h-4 w-4 text-white" />
                  </motion.div>
                </div>
                <CardTitle className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-gray-200">
                  {stat.value}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
