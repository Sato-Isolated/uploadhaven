'use client';

import { motion } from 'motion/react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { StatsHeaderProps } from '../types';
import { useTranslations } from 'next-intl';

export default function StatsHeader({ onRefresh }: StatsHeaderProps) {
  const t = useTranslations('Stats');
  const tCommon = useTranslations('Common');
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <TrendingUp className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <CardTitle>{t('serverStatistics')}</CardTitle>
            <CardDescription>
              {t('realTimeServerMetrics')}
            </CardDescription>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {tCommon('refresh')}
        </Button>
      </motion.div>
    </CardHeader>
  );
}
