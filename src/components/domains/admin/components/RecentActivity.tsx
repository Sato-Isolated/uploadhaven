'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Upload, 
  Download, 
  Users, 
  FileText, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import type { AdminActivity } from '@/types/admin';

interface RecentActivityProps {
  activities: AdminActivity[];
  isLoading: boolean;
}

function getActivityIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'upload':
    case 'file_upload':
      return Upload;
    case 'download':
    case 'file_download':
      return Download;
    case 'user_registered':
    case 'user_login':
      return Users;
    case 'file_deleted':
      return FileText;
    case 'security_event':
    case 'suspicious_activity':
      return AlertTriangle;
    default:
      return Activity;
  }
}

function getActivityColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'upload':
    case 'file_upload':
      return 'bg-green-500 dark:bg-green-600';
    case 'download':
    case 'file_download':
      return 'bg-blue-500 dark:bg-blue-600';
    case 'user_registered':
    case 'user_login':
      return 'bg-purple-500 dark:bg-purple-600';
    case 'file_deleted':
      return 'bg-yellow-500 dark:bg-yellow-600';
    case 'security_event':
    case 'suspicious_activity':
      return 'bg-red-500 dark:bg-red-600';
    default:
      return 'bg-gray-500 dark:bg-gray-600';
  }
}

function getActivityBadgeVariant(type: string) {
  switch (type.toLowerCase()) {
    case 'security_event':
    case 'suspicious_activity':
      return 'destructive' as const;
    case 'upload':
    case 'file_upload':
      return 'default' as const;
    case 'user_registered':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

export default function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const dateLocale = locale === 'fr' ? fr : enUS;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          {t('recentActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-8 text-center">
            <Activity className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('noRecentActivity')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const iconColor = getActivityColor(activity.type);
              const badgeVariant = getActivityBadgeVariant(activity.type);
              
              return (                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  {/* Icône avec indicateur de couleur */}
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${iconColor}`} />
                  </div>
                  
                  {/* Contenu de l'activité */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                        {activity.description}
                      </p>
                      <Badge variant={badgeVariant} className="text-xs shrink-0">
                        {activity.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}                      </span>
                      {activity.userName && (
                        <>
                          <span>•</span>
                          <span>{activity.userName}</span>
                        </>
                      )}
                    </div>                    {activity.metadata?.details ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {String(activity.metadata.details)}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
            
            {activities.length >= 10 && (
              <div className="pt-2 text-center">
                <p className="text-xs text-gray-500">
                  {t('showingRecentActivities', { count: activities.length })}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
