'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface SecurityAnalyticsData {
  eventsByType: Array<{
    _id: string;
    count: number;
  }>;
  recentEvents: Array<{
    type: string;
    timestamp: string;
  }>;
}

interface SecurityAnalyticsTabProps {
  securityAnalytics: SecurityAnalyticsData;
  formatDateTime: (date: string) => string;
}

export function SecurityAnalyticsTab({
  securityAnalytics,
  formatDateTime,
}: SecurityAnalyticsTabProps) {
  const t = useTranslations('Admin');
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Security Events Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('securityEvents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={securityAnalytics.eventsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentSecurityEvents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAnalytics.recentEvents
                .slice(0, 8)
                .map((event, index) => (
                  <div
                    key={`${event.type}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {event.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(event.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
