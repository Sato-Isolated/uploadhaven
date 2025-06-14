'use client';

import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import {
  Download,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { DownloadAnalytics, TrendData } from './utils';
import { useTranslations } from 'next-intl';

interface AnalyticsOverviewProps {
  analytics: DownloadAnalytics;
  trend: TrendData;
}

export default function AnalyticsOverview({
  analytics,
  trend,
}: AnalyticsOverviewProps) {
  const t = useTranslations('Analytics');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Total Downloads Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {t('totalDownloads')}
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.totalDownloads.toLocaleString()}
              </p>
            </div>
            <Download className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>
      </motion.div>

      {/* Last 24 Hours Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 p-6 dark:border-emerald-800 dark:from-emerald-950 dark:to-green-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {t('last24Hours')}
              </p>
              <p className="mt-1 text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                {analytics.last24hDownloads.toLocaleString()}
              </p>
              {trend.trend !== 'neutral' && (
                <div className="mt-2 flex items-center gap-1">
                  {trend.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      trend.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {trend.percentage}%
                  </span>
                </div>
              )}
            </div>
            <Activity className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </Card>
      </motion.div>

      {/* Last 7 Days Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-100 p-6 dark:border-purple-800 dark:from-purple-950 dark:to-violet-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {t('last7Days')}
              </p>
              <p className="mt-1 text-3xl font-bold text-purple-900 dark:text-purple-100">
                {analytics.last7dDownloads.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                {t('avgPerDay', {
                  count: Math.round(analytics.last7dDownloads / 7),
                })}
              </p>
            </div>
            <BarChart3 className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
