'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Files, 
  Download,
  Activity,
  Clock,
  Database
} from 'lucide-react';

export default function AdminAnalytics() {
  const t = useTranslations('Admin');

  // Mock analytics data - replace with real data from API
  const mockData = {
    overview: [
      {
        title: t('totalUploads'),
        value: '12,584',
        change: '+12%',
        trend: 'up',
        icon: Files,
        color: 'text-blue-600 dark:text-blue-400'
      },
      {
        title: t('totalDownloads'),
        value: '45,231',
        change: '+8%',
        trend: 'up',
        icon: Download,
        color: 'text-green-600 dark:text-green-400'
      },
      {
        title: t('activeUsers'),
        value: '2,847',
        change: '+15%',
        trend: 'up',
        icon: Users,
        color: 'text-purple-600 dark:text-purple-400'
      },
      {
        title: t('storageUsed'),
        value: '1.2 TB',
        change: '+5%',
        trend: 'up',
        icon: Database,
        color: 'text-orange-600 dark:text-orange-400'
      }
    ],
    recentActivity: [
      {
        type: 'upload',
        description: 'Large PDF document uploaded',
        user: 'user@example.com',
        timestamp: '2 minutes ago',
        size: '25.3 MB'
      },
      {
        type: 'download',
        description: 'Image file downloaded',
        user: 'anonymous',
        timestamp: '5 minutes ago',
        count: '12 times'
      },
      {
        type: 'user_register',
        description: 'New user registered',
        user: 'newuser@example.com',
        timestamp: '10 minutes ago'
      },
      {
        type: 'delete',
        description: 'File expired and deleted',
        user: 'system',
        timestamp: '15 minutes ago'
      }
    ],
    topFiles: [
      { name: 'presentation.pdf', downloads: 1250, size: '15.2 MB' },
      { name: 'image-gallery.zip', downloads: 890, size: '45.8 MB' },
      { name: 'document.docx', downloads: 670, size: '2.1 MB' },
      { name: 'video-demo.mp4', downloads: 540, size: '125.7 MB' },
      { name: 'spreadsheet.xlsx', downloads: 420, size: '8.9 MB' }
    ]
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Files className="h-4 w-4 text-blue-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'user_register':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'delete':
        return <Activity className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockData.overview.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <IconComponent className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      {metric.change}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('recentActivity')}
            </CardTitle>
            <CardDescription>
              {t('recentActivityDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.user}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {activity.timestamp}
                      </div>
                      {activity.size && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.size}
                          </span>
                        </>
                      )}
                      {activity.count && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.count}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('topFiles')}
            </CardTitle>
            <CardDescription>
              {t('topFilesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.topFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[150px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.size}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">
                        {file.downloads.toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('analyticsCharts')}
          </CardTitle>
          <CardDescription>
            {t('analyticsChartsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('chartsComingSoon')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('chartsComingSoonDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
