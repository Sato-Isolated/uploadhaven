// FileCard.tsx - Individual file card component with details and actions

'use client';

import { motion } from 'motion/react';
import { formatFileSize } from '@/lib/core/utils';
import { formatDistanceToNow } from 'date-fns';
import FileActionButtons from './FileActionButtons';
import FileThumbnail from './FileThumbnail';
import type { FileCardProps } from '../types';
import { useTranslations } from 'next-intl';

export default function FileCard({
  file,
  index,
  onPreview,
  onCopyLink,
  onDownload,
  onDelete,
  getExpirationStatus,
}: FileCardProps) {
  const expirationStatus = getExpirationStatus(file.expiresAt);
  const tFiles = useTranslations('Files');
  const tAdmin = useTranslations('Admin');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{
        delay: index * 0.05,
        layout: { duration: 0.3 },
        exit: { duration: 0.2 },
      }}
      className="group relative"
    >
      <motion.div
        className="relative rounded-2xl border border-white/30 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:border-gray-700/30 dark:bg-gray-800/80"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-center space-x-6">
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <FileThumbnail
              shortUrl={file.shortUrl}
              mimeType={file.mimeType}
              originalName={file.originalName}
              size={56}
              className="rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-2 backdrop-blur-sm"
            />
          </motion.div>
          <div className="min-w-0 flex-1">
            <motion.h3
              className="mb-1 truncate text-lg font-semibold text-gray-900 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {file.originalName}
            </motion.h3>
            <div className="text-muted-foreground mb-3 flex items-center space-x-4 text-sm">
              <span className="font-medium">{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>
                {tFiles('uploaded')}
                {formatDistanceToNow(new Date(file.uploadDate), {
                  addSuffix: true,
                })}
              </span>
              {file.downloadCount > 0 && (
                <>
                  <span>•</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {file.downloadCount}
                    {file.downloadCount === 1
                      ? tFiles('download')
                      : tFiles('downloads')}
                  </span>
                </>
              )}
            </div>

            {/* Status badges */}
            <div className="flex items-center space-x-2">
              {expirationStatus.expired ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200"
                >
                  {tFiles('expired')}
                </motion.div>
              ) : expirationStatus.isExpiringSoon ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                >
                  {tFiles('expiresIn')} {expirationStatus.timeLeft}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200"
                >
                  {tAdmin('active')}
                </motion.div>
              )}
            </div>
          </div>
          {/* Action buttons */}
          <FileActionButtons
            onPreview={() => onPreview(file)}
            onCopyLink={() => onCopyLink(file.name)}
            onDownload={() => onDownload(file.name)}
            onDelete={() => onDelete(file.name)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
