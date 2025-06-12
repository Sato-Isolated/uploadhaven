'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle } from 'lucide-react';
import { QuotaStatus } from '@/types/security';

interface QuotaStatusDisplayProps {
  quotaStatus: QuotaStatus | null;
  virusTotalConfigured: boolean;
}

export function QuotaStatusDisplay({
  quotaStatus,
  virusTotalConfigured,
}: QuotaStatusDisplayProps) {
  if (!quotaStatus) return null;

  const usagePercentage = (quotaStatus.used / quotaStatus.total) * 100;
  const isLowQuota = usagePercentage > 80;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5" />
          VirusTotal API Status
        </CardTitle>
        <CardDescription>
          {virusTotalConfigured
            ? 'VirusTotal integration is active'
            : 'VirusTotal API not configured'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {virusTotalConfigured ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Quota Usage</span>
              <Badge variant={isLowQuota ? 'destructive' : 'default'}>
                {quotaStatus.used}/{quotaStatus.total}
              </Badge>
            </div>

            <Progress
              value={usagePercentage}
              className={`h-2 ${isLowQuota ? 'bg-red-100' : 'bg-green-100'}`}
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {quotaStatus.remaining} requests remaining
              </span>
              <span className="text-xs text-gray-500">
                Resets at {new Date(quotaStatus.resetsAt).toLocaleTimeString()}
              </span>
            </div>

            {isLowQuota && (
              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 dark:text-yellow-400">
                  Quota usage is high. Consider upgrading your VirusTotal plan.
                </span>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>
                Enhanced malware detection with {quotaStatus?.remaining || 500}{' '}
                requests remaining today
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              VirusTotal API not configured
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Configure VirusTotal API for enhanced malware detection
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
