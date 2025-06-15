'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, X, Copy, Key } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { UploadedFile } from '@/components/domains/upload/fileuploader/types';
import {
  getFileType,
  copyToClipboard,
} from '@/components/domains/upload/fileuploader/utils';
import { toast } from 'sonner';

interface UploadedFilesListProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onClearCompleted: () => void;
}

export function UploadedFilesList({
  files,
  onRemoveFile,
  onClearCompleted,
}: UploadedFilesListProps) {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  const handleCopyToClipboard = async (url: string, label?: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      toast.success(t('linkCopiedToClipboard', { label: label || t('link') }));
    } else {
      toast.error(t('failedToCopyToClipboard'));
    }
  };

  const getFileIcon = (file: File) => {
    const type = getFileType(file.type);
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'archive':
        return '📦';
      default:
        return '📁';
    }
  };

  if (files.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white">
          {t('filesCount', { count: files.length })}
        </h4>
        {files.some((f) => f.status === 'completed') && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearCompleted}
            className="text-xs"
          >
            {t('clearCompleted')}
          </Button>
        )}
      </div>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center space-x-3">
                <span className="text-2xl">{getFileIcon(file.file)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-white">
                    {file.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} {tCommon('mb')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {file.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                {file.status === 'threat_detected' && (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(file.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {(file.status === 'scanning' || file.status === 'uploading') && (
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">
                    {file.status === 'scanning'
                      ? t('scanning')
                      : t('uploading')}
                  </span>
                  <span className="text-gray-600">{file.progress}%</span>
                </div>
                <Progress value={file.progress} className="h-2" />
              </div>
            )}

            {/* Error Message */}
            {file.error && (
              <div className="mb-2 text-sm text-red-600">{file.error}</div>
            )}

            {/* Success Actions */}
            {file.status === 'completed' && file.shortUrl && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopyToClipboard(
                      `${window.location.origin}/${locale}/s/${file.shortUrl}`,
                      t('shareLink')
                    )
                  }
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t('copyLink')}
                </Button>
                {file.generatedKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyToClipboard(file.generatedKey!, t('password'))
                    }
                    className="flex-1"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {t('copyPassword')}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
