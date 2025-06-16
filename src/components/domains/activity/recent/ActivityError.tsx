'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle } from 'lucide-react';
import { BaseComponentProps } from '@/types';

interface ActivityErrorProps extends BaseComponentProps {
  error: string;
}

export default function ActivityError({ error }: ActivityErrorProps) {
  const t = useTranslations('Activity');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-red-200 bg-white/80 backdrop-blur-sm dark:border-red-800 dark:bg-gray-800/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent dark:from-red-400 dark:to-orange-400">
              {t('recentActivity')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500 opacity-50" />
            <p className="text-lg font-medium text-red-600 dark:text-red-400">
              {t('errorLoadingActivities')}
            </p>
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
