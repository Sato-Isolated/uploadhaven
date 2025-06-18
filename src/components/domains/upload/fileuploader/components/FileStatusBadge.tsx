'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Upload } from 'lucide-react';
import type { FileStatusProps } from '@/types';

type FileStatusBadgeProps = FileStatusProps;

export default function FileStatusBadge({
  status,
}: FileStatusBadgeProps) {
  return (
    <AnimatePresence mode="wait">
      {status === 'uploading' && (
        <motion.div
          key="uploading"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Upload className="mr-1 h-3 w-3" />
            </motion.div>
            Uploading...
          </Badge>
        </motion.div>
      )}
      {status === 'completed' && (
        <motion.div
          key="completed"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <Check className="mr-1 h-3 w-3" />
            </motion.div>
            Complete
          </Badge>
        </motion.div>
      )}
      {status === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
