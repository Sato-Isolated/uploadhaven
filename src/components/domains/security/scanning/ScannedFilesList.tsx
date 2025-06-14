'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScannedFile } from '@/types/security';
import { useTranslations } from 'next-intl';

interface ScannedFilesListProps {
  scannedFiles: ScannedFile[];
  currentFileIndex: number;
  totalFilesToScan: number;
}

interface ScannedFileItemProps {
  file: ScannedFile;
}

function ScannedFileItem({ file }: ScannedFileItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('Security');

  const hasEngineResults =
    file.scanResult?.engineResults && file.scanResult.engineResults.length > 0;

  return (
    <motion.div
      className="rounded border bg-gray-50 dark:bg-gray-800"
      initial={{ opacity: 0.5 }}
      animate={{
        opacity: file.status === 'scanning' ? [1, 0.5, 1] : 1,
        scale: file.status === 'scanning' ? [1, 1.02, 1] : 1,
      }}
      transition={{
        duration: file.status === 'scanning' ? 1.5 : 0.3,
        repeat: file.status === 'scanning' ? Infinity : 0,
      }}
    >
      {/* Main file info row */}
      <div
        className={`flex items-center justify-between p-2 text-xs ${
          hasEngineResults
            ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
            : ''
        }`}
        onClick={() => hasEngineResults && setIsExpanded(!isExpanded)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {file.status === 'scanning' ? (
            <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
          ) : file.status === 'threat' ? (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          ) : file.status === 'suspicious' ? (
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
          ) : file.status === 'error' ? (
            <AlertTriangle className="h-3 w-3 text-gray-500" />
          ) : (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
          <span className="truncate font-mono">{file.fileName}</span>
          {file.details && file.status !== 'scanning' && (
            <span className="ml-1 text-xs text-gray-400">- {file.details}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${
              file.status === 'threat'
                ? 'border-red-500 text-red-600'
                : file.status === 'suspicious'
                  ? 'border-yellow-500 text-yellow-600'
                  : file.status === 'error'
                    ? 'border-gray-500 text-gray-600'
                    : file.status === 'scanning'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-green-500 text-green-600'
            }`}
          >
            {file.status === 'threat'
              ? t('threat')
              : file.status === 'suspicious'
                ? t('suspicious')
                : file.status === 'error'
                  ? t('error')
                  : file.status === 'scanning'
                    ? t('scanning')
                    : t('clean')}
          </Badge>

          {hasEngineResults && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Collapsible detailed results */}
      <AnimatePresence>
        {isExpanded && hasEngineResults && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900">
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    {t('antivirusEngineResults')}
                  </span>
                  <span className="text-gray-500">
                    {file.scanResult?.engineResults?.length || 0} {t('enginesAnalyzed')}
                  </span>
                </div>

                {file.scanResult?.threatName && (
                  <div className="mt-1 text-xs">
                    <span className="font-medium text-red-600">
                      {t('threatDetected')}:
                    </span>
                    <span className="ml-1 font-mono">
                      {file.scanResult.threatName}
                    </span>
                  </div>
                )}
              </div>

              <div className="max-h-32 space-y-1 overflow-y-auto">
                {file.scanResult?.engineResults?.map((engine, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded bg-gray-50 p-1 text-xs dark:bg-gray-800"
                  >
                    <span className="font-medium">{engine.engine}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          engine.result === 'clean' ||
                          engine.result === 'undetected'
                            ? 'border-green-500 text-green-600'
                            : 'border-red-500 text-red-600'
                        }`}
                      >
                        {engine.category || engine.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ScannedFilesList({
  scannedFiles,
  currentFileIndex,
  totalFilesToScan,
}: ScannedFilesListProps) {
  const t = useTranslations('Security');
  
  if (scannedFiles.length === 0) return null;

  const completedScans = scannedFiles.filter(
    (f) => f.status !== 'scanning'
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {t('scannedFiles')} ({completedScans}/{scannedFiles.length})
        </h4>
        {totalFilesToScan > 0 && (
          <span className="text-xs text-gray-500">
            {t('file')} {currentFileIndex}/{totalFilesToScan}
          </span>
        )}
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {scannedFiles.map((file, index) => (
          <ScannedFileItem key={index} file={file} />
        ))}
      </div>
    </div>
  );
}
