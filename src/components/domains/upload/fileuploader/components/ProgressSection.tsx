// components/ProgressSection.tsx - Progress bars and indicators

'use client';

import { motion } from 'motion/react';
import { Progress } from '@/components/ui/progress';
import type { FileHandlerProps } from '@/types';

type ProgressSectionProps = Pick<FileHandlerProps, 'file'>;

export default function ProgressSection({ file }: ProgressSectionProps) {
  // Only show progress for uploading state
  if (file.status !== 'uploading') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Progress
        value={file.progress}
        className="h-2 bg-blue-100 dark:bg-blue-950"
      />
      <motion.div
        className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
        initial={{ width: '0%' }}
        animate={{ width: `${file.progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </motion.div>
  );
}
