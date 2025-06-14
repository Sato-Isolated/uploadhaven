'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Square, RefreshCw, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { ScanType, QuotaStatus } from '@/types/security';
import { useTranslations } from 'next-intl';

interface ScanProgressProps {
  isScanning: boolean;
  scanProgress: number;
  currentScanStep: string;
  selectedScanType: ScanType;
  virusTotalConfigured: boolean;
  virusTotalRequestsUsed: number;
  quotaStatus: QuotaStatus | null;
  onStartScan: () => void;
  onStopScan: () => void;
}

export function ScanProgress({
  isScanning,
  scanProgress,
  currentScanStep,
  selectedScanType,
  virusTotalConfigured,
  virusTotalRequestsUsed,
  quotaStatus,
  onStartScan,
  onStopScan,
}: ScanProgressProps) {
  const t = useTranslations('Security');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('scanControl')}</CardTitle>
        <CardDescription>{t('startOrStopScanning')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={onStartScan}
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {t('start')}{' '}
            {selectedScanType.charAt(0).toUpperCase() +
              selectedScanType.slice(1)}{' '}
            {t('scan')}
          </Button>

          {isScanning && (
            <Button
              variant="outline"
              onClick={onStopScan}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Square className="h-4 w-4" />
              {t('stopScan')}
            </Button>
          )}
        </div>

        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {currentScanStep}
            </div>
            <Progress value={scanProgress} className="h-2" />
            <p className="text-xs text-gray-500">
              {Math.round(scanProgress)}% {t('complete')}
            </p>

            {/* VirusTotal Request Counter */}
            {virusTotalConfigured && virusTotalRequestsUsed > 0 && (
              <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {t('virusTotalRequestsUsed')}
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  {virusTotalRequestsUsed}/{quotaStatus?.total || 500}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
