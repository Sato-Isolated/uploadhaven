'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { MalwareScanResult } from '@/types/security';
import { useTranslations } from 'next-intl';

interface FileScanResult {
  fileName: string;
  fileSize: number;
  scanResult: MalwareScanResult;
  scannedAt: string;
}

interface FileScannerProps {
  isFileScanning: boolean;
  fileScanResults: FileScanResult[];
  onFileScan: (file: File) => void;
}

export function FileScanner({
  isFileScanning,
  fileScanResults,
  onFileScan,
}: FileScannerProps) {
  const t = useTranslations('Security');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          {t('fileScanner')}
        </CardTitle>
        <CardDescription>{t('uploadAndScanFiles')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
            <input
              type="file"
              id="file-scan-input"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileScan(file);
                }
              }}
              disabled={isFileScanning}
            />
            <label
              htmlFor="file-scan-input"
              className={`cursor-pointer ${
                isFileScanning ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <div className="space-y-2">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isFileScanning ? t('scanningFile') : t('clickToSelectFile')}
                </p>
                <p className="text-xs text-gray-500">{t('fileConstraints')}</p>
              </div>
            </label>
          </div>

          {fileScanResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('recentFileScans')}</h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {fileScanResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      {result.scanResult.isMalicious ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : result.scanResult.isSuspicious ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{result.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(result.fileSize / 1024).toFixed(1)}{' '}
                          {t('fileSizeKb')} •{result.scanResult.source}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        result.scanResult.isMalicious
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : result.scanResult.isSuspicious
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }
                    >
                      {result.scanResult.isMalicious
                        ? t('threat')
                        : result.scanResult.isSuspicious
                          ? t('suspicious')
                          : t('clean')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
