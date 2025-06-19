// ActivityItem.tsx - Item d'activité individuel
// Responsibility: Afficher une activité spécifique avec son style et informations

'use client';

import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { 
  Upload, 
  Download, 
  Share, 
  Trash2, 
  Eye, 
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Activity as ActivityIcon
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { BaseComponentProps } from '@/types';

interface ActivityData {
  id: string;
  type: 'upload' | 'download' | 'share' | 'delete' | 'view' | 'login' | 'logout';
  description: string;
  timestamp: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    ip?: string;
    userAgent?: string;
  };
  userId?: string;
  userName?: string;
}

interface ActivityItemProps extends BaseComponentProps {
  activity: ActivityData;
  compact?: boolean;
}

export function ActivityItem({
  activity,
  compact = false,
  className = '',
}: ActivityItemProps) {
  const t = useTranslations('Dashboard');
  const locale = useLocale();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'download':
        return <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'share':
        return <Share className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'view':
        return <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-3 w-3" />;
    
    if (fileType.startsWith('image/')) return <Image className="h-3 w-3" />;
    if (fileType.startsWith('video/')) return <Video className="h-3 w-3" />;
    if (fileType.startsWith('audio/')) return <Music className="h-3 w-3" />;
    if (fileType.includes('zip') || fileType.includes('tar')) return <Archive className="h-3 w-3" />;
    
    return <FileText className="h-3 w-3" />;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'download':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'share':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'view':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: locale === 'fr' ? fr : enUS,
  });

  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
      className={`p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Avatar className={compact ? 'h-8 w-8' : 'h-10 w-10'}>
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getActivityIcon(activity.type)}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-medium text-gray-900 dark:text-gray-100 ${compact ? 'text-sm' : 'text-base'}`}>
              {activity.description}
            </p>
            
            <Badge 
              variant="secondary" 
              className={`text-xs ${getActivityColor(activity.type)}`}
            >
              {t(activity.type)}
            </Badge>
          </div>

          {/* Metadata */}
          {activity.metadata && !compact && (
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-2">
              {activity.metadata.fileName && (
                <div className="flex items-center gap-1">
                  {getFileIcon(activity.metadata.fileType)}
                  <span className="truncate max-w-32">{activity.metadata.fileName}</span>
                </div>
              )}
              
              {activity.metadata.fileSize && (
                <span>{formatFileSize(activity.metadata.fileSize)}</span>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between">
            <p className={`text-gray-500 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
              {timeAgo}
            </p>
            
            {activity.userName && !compact && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {activity.userName}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ActivityItem;
