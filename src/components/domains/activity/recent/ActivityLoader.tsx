'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function ActivityLoader() {
  const t = useTranslations('Activity');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              {t('recentActivity')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
