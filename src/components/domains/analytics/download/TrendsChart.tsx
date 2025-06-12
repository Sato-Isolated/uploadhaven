'use client';

import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DownloadAnalytics } from './utils';

interface TrendsChartProps {
  analytics: DownloadAnalytics;
}

export function TrendsChart({ analytics }: TrendsChartProps) {
  if (!analytics.downloadTrends || analytics.downloadTrends.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-100 p-6 dark:border-orange-800 dark:from-orange-950 dark:to-red-900">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold">
          <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-red-400">
            Download Trends (Last 7 Days)
          </span>
        </h3>{' '}
        <div className="space-y-4">
          {analytics.downloadTrends.map((trend, index) => (
            <motion.div
              key={`${trend.date}-${trend.downloads}`}
              className="flex items-center justify-between rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-gray-800/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {new Date(trend.date).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        20,
                        (trend.downloads /
                          Math.max(
                            ...analytics.downloadTrends.map((t) => t.downloads)
                          )) *
                          120
                      )}px`,
                    }}
                  />
                  <span className="w-8 text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                    {trend.downloads}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
