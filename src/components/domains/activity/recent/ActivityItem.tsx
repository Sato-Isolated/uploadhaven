'use client';

import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { User, Download, Upload, Shield, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityEvent } from '@/types';

interface ActivityItemProps {
  activity: ActivityEvent;
  index: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'file_upload':
      return <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />;
    case 'file_download':
      return <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case 'user_registration':
    case 'user_login':
    case 'user_logout':
      return <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
    case 'malware_detected':
    case 'suspicious_activity':
      return (
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      );
    default:
      return <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
  }
};

const formatActivityType = (type: string) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function ActivityItem({ activity, index }: ActivityItemProps) {
  return (
    <motion.div
      key={activity._id || activity.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
    >
      <div className="mt-1 flex-shrink-0 rounded-lg bg-white p-2 shadow-sm dark:bg-gray-700">
        {getActivityIcon(activity.type)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatActivityType(activity.type)}
          </span>
          <Badge
            className={`text-xs ${getSeverityColor(
              activity.severity || 'low'
            )}`}
          >
            {activity.severity}
          </Badge>
        </div>

        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          {activity.details}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
          <span className="font-medium">
            {formatDistanceToNow(new Date(activity.timestamp), {
              addSuffix: true,
            })}
          </span>
          <span>IP: {activity.ip || 'Unknown'}</span>
          {activity.filename && <span>File: {activity.filename}</span>}
          {activity.userId && <span>User: {activity.userId}</span>}
        </div>
      </div>
    </motion.div>
  );
}
