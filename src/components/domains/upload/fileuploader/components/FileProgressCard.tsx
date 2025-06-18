// components/FileProgressCard.tsx - Individual file progress display

'use client';

import { motion } from 'motion/react';
import FileIcon from './FileIcon';
import FileDetails from './FileDetails';
import FileActions from './FileActions';
import ProgressSection from './ProgressSection';
import FileLinks from './FileLinks';
import type { FileHandlerProps } from '@/types';

interface FileProgressCardProps extends FileHandlerProps {
  index: number;
  onRemoveFile: (id: string) => void;
  onCopyToClipboard: (url: string, label?: string) => void;
}

export default function FileProgressCard({
  file,
  index,
  onRemoveFile,
  onCopyToClipboard,
}: FileProgressCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{
        delay: index * 0.1,
        layout: { duration: 0.3 },
        exit: { duration: 0.2 },
      }}
      className="group relative"
    >
      <motion.div
        className={`flex items-center space-x-4 rounded-xl border p-4 transition-all duration-300 ${
          file.status === 'completed'
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
            : file.status === 'error'
              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
              : 'border-border bg-white dark:bg-gray-800/50'
        } `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* File Icon */}
        <FileIcon status={file.status} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between">
            <motion.p
              className="max-w-xs truncate text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {file.file.name}
            </motion.p>

            {/* File Actions and Status */}
            <FileActions
              file={file}
              onRemoveFile={onRemoveFile}
              onCopyToClipboard={onCopyToClipboard}
            />
          </div>

          {/* File Details */}
          <FileDetails file={file} />

          {/* Progress Section */}
          <ProgressSection file={file} />

          {/* File Links */}
          <FileLinks file={file} onCopyToClipboard={onCopyToClipboard} />
        </div>
      </motion.div>
    </motion.div>
  );
}
