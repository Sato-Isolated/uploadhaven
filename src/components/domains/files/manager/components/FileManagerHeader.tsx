// FileManagerHeader.tsx - Header component for FileManager with title and statistics

'use client';

import { motion } from 'motion/react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/core/utils';
import type { FileManagerHeaderProps } from '../types';
import { useTranslations } from 'next-intl';

export default function FileManagerHeader({
  filesCount,
  totalSize,
}: FileManagerHeaderProps) {
  const t = useTranslations('Stats');

  return (
    <CardHeader className="pb-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('fileManager')}</CardTitle>
              <CardDescription className="text-base">
                {t('manageFilesWithCount', { count: filesCount })}
              </CardDescription>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-right"
          >
            <div className="text-muted-foreground text-sm">
              {t('totalSize')}: {formatFileSize(totalSize)}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </CardHeader>
  );
}
