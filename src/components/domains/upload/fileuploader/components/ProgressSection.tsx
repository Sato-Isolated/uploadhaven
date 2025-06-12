// components/ProgressSection.tsx - Progress bars and indicators

'use client';

import { motion } from 'motion/react';
import { Progress } from '@/components/ui/progress';
import type { FileHandlerProps } from '@/types';

type ProgressSectionProps = Pick<FileHandlerProps, 'file'>;

export default function ProgressSection({ file }: ProgressSectionProps) {
  // Only show progress for uploading and scanning states
  if (file.status !== 'uploading' && file.status !== 'scanning') {
    return null;
  }

  if (file.status === 'uploading') {
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

  if (file.status === 'scanning') {
    return (
      <motion.div className="mt-2 w-full">
        <Progress value={50} className="h-2 bg-blue-100 dark:bg-blue-950" />
        <motion.div
          className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
          animate={{
            width: ['20%', '80%', '20%'],
            x: ['0%', '25%', '0%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: '50%' }}
        />
        <motion.p
          className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🛡️ Scanning for security threats...
        </motion.p>
      </motion.div>
    );
  }

  return null;
}
