'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface ScanHistoryEntry {
  date: Date;
  type: string;
  results: number;
  threats: number;
}

interface ScanHistoryProps {
  scanHistory: ScanHistoryEntry[];
}

export function ScanHistory({ scanHistory }: ScanHistoryProps) {
  const t = useTranslations('Security');

  if (scanHistory.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('scanHistory')}</CardTitle>
        <CardDescription>{t('previousScansPerformed')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {scanHistory.map((scan, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">{scan.type}</Badge>
                <span className="text-sm">
                  {scan.date.toLocaleDateString()}
                  {scan.date.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  {scan.results} {t('checks')}
                </span>
                {scan.threats > 0 ? (
                  <span className="font-medium text-red-600">
                    {scan.threats} {t('threats')}
                  </span>
                ) : (
                  <span className="text-green-600">{t('clean')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
