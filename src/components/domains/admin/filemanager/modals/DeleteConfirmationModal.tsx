'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';

interface DeleteConfirmationModalProps {
  fileToDelete: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function DeleteConfirmationModal({
  fileToDelete,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteConfirmationModalProps) {
  const t = useTranslations('Modal');

  return (
    <Dialog open={fileToDelete !== null} onOpenChange={onCancel}>
      <DialogContent className="max-w-md border border-red-200/60 bg-white/95 backdrop-blur-sm dark:border-red-800/60 dark:bg-gray-900/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Trash2 className="h-5 w-5" />
            </motion.div>
            {t('deleteFile')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {t('deleteFileDescription')}
          </DialogDescription>
        </DialogHeader>
        <motion.div
          className="mt-6 flex justify-end gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="bg-white/50 dark:bg-gray-900/50"
            >
              {t('cancel')}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('delete')}
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
