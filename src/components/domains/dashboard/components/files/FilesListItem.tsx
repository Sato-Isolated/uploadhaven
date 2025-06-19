// FilesListItem.tsx - Individual file item component (SRP)

'use client';

import { motion } from 'motion/react';
import { formatFileSize } from '@/lib/core/utils';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

import FilesActions from './FilesActions';
import FilesThumbnail from './FilesThumbnail';
import { getExpirationStatus } from './utils';

import type { FilesListItemProps } from './types';

/**
 * FilesListItem - Individual file item component for scrollable list
 * Responsibilities:
 * - Well-spaced display of file information
 * - Hover states and interactions
 * - Clear hierarchy and readability
 */
export default function FilesListItem({
  file,
  index,
  onDelete,
  deleteLoading = false,
}: FilesListItemProps) {
  const tFiles = useTranslations('Files');
  
  // Create a compatible translation function for getExpirationStatus
  const translate = (key: string, params?: Record<string, unknown>) => {
    return tFiles(key as any, params as any);
  };
  
  const expirationStatus = getExpirationStatus(file.expiresAt, translate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        delay: index * 0.05,
        layout: { duration: 0.3 },
        exit: { duration: 0.2 },
      }}
      className="group"
    >
      <motion.div
        className="relative rounded-xl border border-gray-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-blue-300/60 hover:bg-white hover:shadow-lg dark:border-gray-700/60 dark:bg-gray-800/95 dark:hover:border-blue-600/40 dark:hover:bg-gray-800"
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start gap-4">
          {/* Enhanced Thumbnail */}
          <div className="flex-shrink-0">
            <FilesThumbnail
              mimeType={file.mimeType}
              size={48}
              className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-2 shadow-sm dark:from-blue-950/30 dark:to-purple-950/30"
            />
          </div>

          {/* File Info - Main Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* File Name */}
                <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white mb-2 leading-relaxed">
                  {file.originalName}
                </h3>
                
                {/* File Details */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <span className="font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {formatFileSize(file.size)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>
                    {formatDistanceToNow(new Date(file.uploadDate), { addSuffix: true })}
                  </span>
                  {file.downloadCount > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-md">
                        {file.downloadCount} {tFiles('downloads')}
                      </span>
                    </>
                  )}
                </div>

                {/* Expiration Status */}
                <div className="mb-1">
                  <span
                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
                      expirationStatus.variant === 'destructive'
                        ? 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800/30'
                        : 'bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800/30'
                    }`}
                  >
                    {expirationStatus.text}
                  </span>
                </div>
              </div>              {/* Actions - Enhanced Visibility */}
              <div className="flex-shrink-0 opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105">
                <FilesActions
                  onDelete={() => onDelete?.(file)}
                  disabled={deleteLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced hover effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/8 to-purple-500/8 opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}
