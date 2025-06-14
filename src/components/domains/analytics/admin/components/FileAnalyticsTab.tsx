'use client';

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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTranslations } from 'next-intl';

interface FileAnalyticsData {
  uploadTrends: Array<{
    date: string;
    count: number;
  }>;
  fileTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
  topFiles: Array<{
    filename: string;
    originalName: string;
    downloadCount: number;
    size: string;
    mimeType: string;
  }>;
}

interface FileAnalyticsTabProps {
  fileAnalytics: FileAnalyticsData;
  formatDate: (date: string) => string;
  getFileTypeIcon: (mimeType: string) => string;
  colors: string[];
}

export function FileAnalyticsTab({
  fileAnalytics,
  formatDate,
  getFileTypeIcon,
  colors,
}: FileAnalyticsTabProps) {
  const t = useTranslations('Analytics');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upload Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('uploadTrends')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fileAnalytics.uploadTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => formatDate(value as string)}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name={t('filesUploaded')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* File Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('fileTypeDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fileAnalytics.fileTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) =>
                    `${getFileTypeIcon(type)} ${count}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {fileAnalytics.fileTypeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Files */}
      <Card>
        <CardHeader>
          <CardTitle>{t('mostDownloadedFiles')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fileAnalytics.topFiles.slice(0, 8).map((file) => (
              <div
                key={file.filename}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getFileTypeIcon(file.mimeType)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{file.originalName}</p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {file.downloadCount} {t('downloads')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
