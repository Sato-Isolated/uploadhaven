// components/FileProgressList.tsx - List container for file progress cards

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { File } from 'lucide-react';
import FileProgressCard from './FileProgressCard';
import type { FileProgressProps } from '../types';

export default function FileProgressList({
  files,
  onRemoveFile,
  onCopyToClipboard,
}: FileProgressProps) {
  if (files.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 p-6 shadow-lg dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <motion.h3
          className="mb-6 flex items-center text-lg font-semibold"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mr-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
            <File className="h-4 w-4 text-white" />
          </div>
          Upload Progress ({files.length} file
          {files.length !== 1 ? 's' : ''})
        </motion.h3>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {files.map((file, index) => (
              <FileProgressCard
                key={file.id}
                file={file}
                index={index}
                onRemoveFile={onRemoveFile}
                onCopyToClipboard={onCopyToClipboard}
              />
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
