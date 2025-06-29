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
import { formatFileSize } from '@/lib/core/utils';
import type { AdminFileData } from '@/types';
import { formatDate, getFileTypeIcon } from '../utils';

interface FileDetailsModalProps {
  file: AdminFileData | null;
  onClose: () => void;
}

export default function FileDetailsModal({
  file,
  onClose,
}: FileDetailsModalProps) {
  const t = useTranslations('Admin');

  if (!file) return null;

  const fileDetails = [
    {
      label: t('originalName'),
      value: file.originalName,
    },
    {
      label: t('systemName'),
      value: file.name,
      mono: true,
    },
    {
      label: t('size'),
      value: formatFileSize(file.size),
    },
    {
      label: t('type'),
      value: file.mimeType,
    },
    {
      label: t('uploadDate'),
      value: formatDate(file.uploadDate),
    },
    {
      label: t('downloads'),
      value: file.downloadCount.toString(),
    },
    {
      label: t('owner'),
      value: file.isAnonymous ? t('anonymous') : file.userName || t('unknown'),
    },
    {
      label: t('fileId'),
      value: file.id,
      mono: true,
    },
  ];

  return (
    <Dialog open={file !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md border border-gray-200/60 bg-white/95 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              className="text-2xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getFileTypeIcon(file.mimeType)}
            </motion.div>
            {t('fileDetails')}
          </DialogTitle>
          <DialogDescription>{t('fileDetailsDescription')}</DialogDescription>
        </DialogHeader>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {fileDetails.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="rounded-lg border border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100 p-3 dark:border-gray-700/50 dark:from-gray-800 dark:to-gray-900"
            >
              <strong className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                {item.label}:
              </strong>
              <p
                className={`text-sm text-gray-600 dark:text-gray-400 ${
                  item.mono
                    ? 'rounded bg-gray-100 px-2 py-1 font-mono dark:bg-gray-800'
                    : ''
                }`}
              >
                {item.value}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
