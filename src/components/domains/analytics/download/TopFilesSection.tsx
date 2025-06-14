'use client';

import { motion } from 'motion/react';
import { Eye, RefreshCw, FileText, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadAnalytics, getFileTypeIcon } from './utils';
import { useTranslations } from 'next-intl';

interface TopFilesSectionProps {
  analytics: DownloadAnalytics;
  onRefresh: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function TopFilesSection({
  analytics,
  onRefresh,
}: TopFilesSectionProps) {
  const t = useTranslations('Analytics');
  const tCommon = useTranslations('Common');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="border-gray-200 bg-white/80 p-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {t('mostDownloadedFiles')}
          </h3>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {tCommon('refresh')}
          </Button>
        </div>

        {analytics.topFiles.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 opacity-30" />
            <p className="text-lg font-medium">{t('noDownloadData')}</p>
            <p className="mt-1 text-sm">{t('filesWillAppear')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.topFiles.map((file, index) => (
              <motion.div
                key={file.filename}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="text-2xl">{getFileTypeIcon(file.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        #{index + 1}
                      </Badge>
                      <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                        {file.originalName}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)} • {t('uploaded')}{' '}
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {file.downloadCount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('downloads')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
