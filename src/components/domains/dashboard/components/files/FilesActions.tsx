// FilesActions.tsx - File action buttons component (SRP)

'use client';

import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { FilesActionsProps } from './types';

/**
 * FilesActions - File action buttons component
 * Responsibilities:
 * - Rendering only the delete action (zero-knowledge encryption means other actions are not available)
 * - Handling delete button state (disabled, loading)
 */
export default function FilesActions({
  onDelete,
  disabled = false,
}: FilesActionsProps) {
  const t = useTranslations('Files');
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <motion.div
      className="flex items-center"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={disabled}
        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
        title={t('delete')}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
