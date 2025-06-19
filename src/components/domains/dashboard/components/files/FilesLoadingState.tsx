// FilesLoadingState.tsx - Loading state component for files (SRP)

'use client';

import { motion } from 'motion/react';
import { Loader2, Files } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import type { FilesLoadingStateProps } from './types';

// Simple skeleton component (inline to avoid dependency issues)
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

/**
 * FilesLoadingState - Loading state component for files
 * Responsibilities:
 * - Displaying loading animation and skeleton
 * - Providing visual feedback during data fetching
 * - Maintaining layout consistency
 */
export default function FilesLoadingState({ className = '' }: FilesLoadingStateProps) {
  const t = useTranslations('Files');
  return (
    <div className={`h-[500px] flex flex-col ${className}`}>
      <motion.div
        className="h-full w-full max-w-4xl mx-auto flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >        <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-lg dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 flex flex-col h-full">
          {/* Header skeleton */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
            <div>
              <div className="flex items-center space-x-2">
                <Files className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <Skeleton className="h-6 w-24" />
              </div>
              <motion.div
                className="mt-2 flex items-center space-x-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Skeleton className="h-4 w-16" />
                <span className="text-muted-foreground">•</span>
                <Skeleton className="h-4 w-20" />
              </motion.div>
            </div>
            <Skeleton className="h-9 w-20" />
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-6">
            <div className="h-full flex flex-col">
              {/* Loading message */}
              <motion.div
                className="flex items-center justify-center space-x-3 py-8"
                initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <span className="text-muted-foreground">
                {t('loadingFiles', { defaultValue: 'Loading your files...' })}
              </span>
            </motion.div>

            {/* File item skeletons */}
            {Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={index}
                className="rounded-2xl border border-white/30 bg-white/80 p-6 backdrop-blur-sm dark:border-gray-700/30 dark:bg-gray-800/80"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
              >
                <div className="flex items-center space-x-6">
                  {/* Thumbnail skeleton */}
                  <div className="flex-shrink-0">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                  </div>

                  {/* Content skeleton */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-16" />
                      <span className="text-muted-foreground">•</span>
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>

                  {/* Actions skeleton */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </div>
              </motion.div>            ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
