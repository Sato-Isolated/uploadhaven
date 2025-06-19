// StatsErrorState following SRP principles
// Responsibility: Error state for statistics

'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface StatsErrorStateProps {
  error: Error;
  onRetry?: () => void;
  className?: string;
}

export function StatsErrorState({ 
  error, 
  onRetry,
  className = '' 
}: StatsErrorStateProps) {
  const t = useTranslations('Errors');

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-lg dark:border-red-800 dark:from-red-950 dark:to-red-900">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-2"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertCircle className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="font-medium text-red-700 dark:text-red-300">
                {t('unableToLoadStatistics')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error?.message || t('unexpectedError')}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('retry')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
