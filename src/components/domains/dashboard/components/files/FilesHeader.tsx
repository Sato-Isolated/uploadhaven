// FilesHeader.tsx - Header component for files section (SRP)

'use client';

import { motion } from 'motion/react';
import { RefreshCw, Files, HardDrive } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/core/utils';
import { useTranslations } from 'next-intl';
import type { FilesHeaderProps } from './types';

/**
 * FilesHeader - Header component for files management
 * Responsibilities:
 * - Displaying file count and total size stats
 * - Providing refresh functionality
 * - Consistent header styling
 */
export default function FilesHeader({
  filesCount,
  totalSize,
  onRefresh,
}: FilesHeaderProps) {
  const t = useTranslations('Files');

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <div>
        <CardTitle className="flex items-center space-x-2 text-xl font-bold">
          <Files className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>{t('myFiles')}</span>
        </CardTitle>
        <motion.div
          className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-1">
            <Files className="h-3 w-3" />
            <span>
              {filesCount} {filesCount === 1 ? t('file') : t('files')}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(totalSize)}</span>
          </div>
        </motion.div>
      </div>
      
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t('refresh')}</span>
        </Button>
      )}
    </CardHeader>
  );
}
