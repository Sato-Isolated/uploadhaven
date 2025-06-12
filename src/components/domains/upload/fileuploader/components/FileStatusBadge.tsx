'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Check } from 'lucide-react';
import type { FileStatusProps } from '@/types';

type FileStatusBadgeProps = FileStatusProps;

export default function FileStatusBadge({
  status,
  threatDetails,
}: FileStatusBadgeProps) {
  return (
    <AnimatePresence mode="wait">
      {status === 'scanning' && (
        <motion.div
          key="scanning"
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
              <Shield className="mr-1 h-3 w-3" />
            </motion.div>
            Scanning...
          </Badge>
        </motion.div>
      )}
      {status === 'threat_detected' && (
        <motion.div
          key="threat"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
              }}
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
            </motion.div>
            {threatDetails || 'Threat'}
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
