'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Server, 
  Cpu, 
  HardDrive, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SystemHealth } from '@/types/admin';

interface SystemHealthProps {
  health: SystemHealth | null;
  isLoading: boolean;
  detailed?: boolean;
}

function getStatusIcon(status: 'healthy' | 'warning' | 'critical') {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;    case 'critical':
      return XCircle;
  }
}

function getStatusColor(status: 'healthy' | 'warning' | 'critical') {
  switch (status) {
    case 'healthy':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'critical':
      return 'text-red-600 dark:text-red-400';
  }
}

function getStatusBadgeVariant(status: 'healthy' | 'warning' | 'critical') {
  switch (status) {
    case 'healthy':
      return 'default' as const;
    case 'warning':
      return 'secondary' as const;
    case 'critical':
      return 'destructive' as const;
  }
}

function getProgressColor(value: number) {
  if (value >= 90) return 'bg-red-500 dark:bg-red-600';
  if (value >= 75) return 'bg-yellow-500 dark:bg-yellow-600';
  return 'bg-green-500 dark:bg-green-600';
}

export default function SystemHealth({ health, isLoading, detailed = false }: SystemHealthProps) {
  const t = useTranslations('Admin');
  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Activity className="h-5 w-5 animate-pulse text-gray-600 dark:text-gray-400" />
            {t('systemHealth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: detailed ? 6 : 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {t('systemHealth')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
            <p className="text-sm text-gray-500">{t('healthDataUnavailable')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = getStatusIcon(health.status);
  const statusColor = getStatusColor(health.status);
  const statusBadgeVariant = getStatusBadgeVariant(health.status);
  const metrics = [
    {
      label: t('memoryUsage'),
      value: health.metrics.memoryUsage,
      icon: Cpu,
      unit: '%',
    },
    {
      label: t('diskUsage'),
      value: health.metrics.diskUsage,
      icon: HardDrive,
      unit: '%',
    },    ...(detailed ? [
      {
        label: t('responseTime'),
        value: health.metrics.networkLatency,
        icon: Clock,
        unit: 'ms',
        isCount: true,
      },
    ] : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('systemHealth')}
          </CardTitle>
          {detailed && (
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status général */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${statusColor}`} />              <span className="font-medium">
                {health.status === 'healthy' ? t('healthy') : 
                 health.status === 'warning' ? t('warning') : t('critical')}
              </span>
            </div>
            <Badge variant={statusBadgeVariant}>
              {health.status.toUpperCase()}
            </Badge>
          </div>

          {/* Uptime */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">{t('uptime')}</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {health.uptime}
            </span>
          </div>

          {/* Métriques */}
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isProgress = !metric.isCount;
            
            return (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.value}{metric.unit}
                  </span>
                </div>
                
                {isProgress && (
                  <div className="relative">
                    <Progress 
                      value={metric.value} 
                      className="h-2"
                    />
                    <div 
                      className={`absolute inset-0 h-2 rounded-full transition-all ${getProgressColor(metric.value)}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                )}
              </div>
            );          })}

          {detailed && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">{t('systemServices')}</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('database')}</span>
                  <Badge variant="default" className="h-5 text-xs">
                    {t('running')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('fileStorage')}</span>
                  <Badge variant="default" className="h-5 text-xs">
                    {t('running')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('authentication')}</span>
                  <Badge variant="default" className="h-5 text-xs">
                    {t('running')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('notifications')}</span>
                  <Badge variant="default" className="h-5 text-xs">
                    {t('running')}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
