'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';
import { ManagementActionsProps } from '../types';
import { useTranslations } from 'next-intl';

export default function ManagementActions({
  stats,
  bulkDeleting,
  onRunCleanup,
  onBulkDeleteAll,
}: ManagementActionsProps) {
  const t = useTranslations('Stats');
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
    >
      <h3 className="text-lg font-medium">{t('fileManagement')}</h3>
      <div className="flex flex-wrap gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" onClick={onRunCleanup}>
            <Clock className="mr-2 h-4 w-4" />
            {t('cleanExpiredFiles')}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="destructive"
            onClick={onBulkDeleteAll}
            disabled={stats.totalFiles === 0 || bulkDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {bulkDeleting
              ? t('deleting')
              : `${t('deleteAll')} (${stats.totalFiles})`}
          </Button>
        </motion.div>
      </div>
      <motion.p
        className="text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.5 }}
      >
        {t('cleanupDescription')}
      </motion.p>
    </motion.div>
  );
}
