// FilesErrorState.tsx - Error state component for files (SRP)

'use client';

import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, Files } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import type { FilesErrorStateProps } from './types';

/**
 * FilesErrorState - Error state component for files
 * Responsibilities:
 * - Displaying error messages and status
 * - Providing retry functionality
 * - User-friendly error presentation
 */
export default function FilesErrorState({
  error = 'Something went wrong',
  onRetry,
  className = '',
}: FilesErrorStateProps) {
  const t = useTranslations('Files');  return (
    <div className={`h-[500px] flex flex-col ${className}`}>
      <motion.div
        className="h-full w-full max-w-2xl mx-auto flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-0 bg-gradient-to-br from-white via-red-50/30 to-orange-50/30 shadow-lg dark:from-gray-900 dark:via-red-950/20 dark:to-orange-950/20 flex flex-col h-full">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center flex-1">
            {/* Error Icon */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500/10 to-orange-600/10 backdrop-blur-sm"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </motion.div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              className="mb-8 space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('errorLoadingFiles', { defaultValue: 'Error loading files' })}
              </h3>
              <p className="max-w-md text-muted-foreground">
                {error || t('errorDescription', { 
                  defaultValue: 'We encountered an issue while loading your files. Please try again.' 
                })}
              </p>
            </motion.div>

            {/* Retry Button */}
            {onRetry && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Button
                  onClick={onRetry}
                  className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-3 text-white shadow-lg transition-all duration-300 hover:from-red-700 hover:to-orange-700 hover:scale-105"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {t('retry', { defaultValue: 'Try again' })}
                </Button>
              </motion.div>
            )}

            {/* Help Links */}
            <motion.div
              className="mt-8 space-y-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Files className="h-4 w-4" />
                <span>
                  {t('needHelp', { defaultValue: 'Need help? Check our support documentation.' })}
                </span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
