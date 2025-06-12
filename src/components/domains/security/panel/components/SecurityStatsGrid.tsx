import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  AlertTriangle,
  FileX,
  Ban,
  Clock,
  Bug,
  HardDrive,
} from 'lucide-react';
import { SecurityStatsGridProps, SecurityStatCardProps } from '../types';

function SecurityStatCard({
  title,
  value,
  icon,
  color,
}: SecurityStatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`${color}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecurityStatsGrid({
  stats,
  isLoading,
}: SecurityStatsGridProps) {
  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents || 0,
      icon: <Shield className="h-4 w-4" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Rate Limits',
      value: stats.rateLimitHits || 0,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Invalid Files',
      value: stats.invalidFiles || 0,
      icon: <FileX className="h-4 w-4" />,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Blocked IPs',
      value: stats.blockedIPs || 0,
      icon: <Ban className="h-4 w-4" />,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Last 24h',
      value: stats.last24h || 0,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Malware Detected',
      value: stats.malwareDetected || 0,
      icon: <Bug className="h-4 w-4" />,
      color: 'text-red-700 dark:text-red-500',
    },
    {
      title: 'Large Files Blocked',
      value: stats.largeSizeBlocked || 0,
      icon: <HardDrive className="h-4 w-4" />,
      color: 'text-gray-600 dark:text-gray-400',
    },
  ];
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <SecurityStatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
