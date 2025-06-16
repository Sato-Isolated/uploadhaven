'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface UserAnalyticsData {
  growthTrends: Array<{
    date: string;
    count: number;
  }>;
  storageByUser: Array<{
    userId: string;
    userName: string;
    totalSize: string;
    fileCount: number;
  }>;
}

interface UserAnalyticsTabProps {
  userAnalytics: UserAnalyticsData;
  formatDate: (date: string) => string;
}

export function UserAnalyticsTab({
  userAnalytics,
  formatDate,
}: UserAnalyticsTabProps) {
  const t = useTranslations('Admin');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userAnalytics.growthTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => formatDate(value as string)}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2}
                  name={t('newUsers')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Storage by User */}
        <Card>
          <CardHeader>
            <CardTitle>{t('topUsersByStorage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAnalytics.storageByUser.slice(0, 8).map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {user.userName || t('unknownUser')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('filesCount', { count: user.fileCount })}
                    </p>
                  </div>
                  <Badge variant="outline">{user.totalSize}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
