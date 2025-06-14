'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAsyncOperation } from '@/hooks';

type ExportType = 'users' | 'files';
type ExportFormat = 'json' | 'csv';

export default function DataExport() {
  const t = useTranslations('Admin');
  const [exportType, setExportType] = useState<ExportType>('users');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  const { loading: exporting, execute: executeExport } = useAsyncOperation({
    onSuccess: () => {
      toast.success(
        t('dataExportedSuccess', {
          type: exportType,
          format: exportFormat.toUpperCase(),
        })
      );
    },
    onError: () => {
      toast.error(t('failedToExportData'));
    },
  });

  const handleExport = () => {
    executeExport(async () => {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: exportType,
          format: exportFormat,
        }),
      });

      if (!response.ok) {
        throw new Error(t('exportFailed'));
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${exportType}_export.${exportFormat}`;

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('dataExport')}
          </CardTitle>
          <CardDescription>{t('dataExportDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('dataType')}</label>
              <Select
                value={exportType}
                onValueChange={(value: ExportType) => setExportType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('users')}
                    </div>
                  </SelectItem>
                  <SelectItem value="files">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('files')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('format')}</label>
              <Select
                value={exportFormat}
                onValueChange={(value: ExportFormat) => setExportFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('action')}</label>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                {exporting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    {t('exporting')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('export')}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
            <strong>{t('note')}:</strong> {t('exportNote')}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
