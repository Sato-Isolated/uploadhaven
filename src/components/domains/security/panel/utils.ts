import React from 'react';
import {
  Shield,
  AlertTriangle,
  FileX,
  Ban,
  Bug,
  HardDrive,
  UserX,
  Activity,
  Settings,
} from 'lucide-react';
import type { SecuritySeverity, SecurityEventType } from '@/types';

export const getSeverityColor = (severity?: SecuritySeverity): string => {
  switch (severity) {
    case 'low':
      return 'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950';
    case 'medium':
      return 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950';
    case 'high':
      return 'text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950';
    case 'critical':
      return 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950';
    default:
      return 'text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950';
  }
};

export const getEventIcon = (type: SecurityEventType): React.ReactNode => {
  switch (type) {
    case 'rate_limit':
      return React.createElement(AlertTriangle, {
        className: 'w-4 h-4 text-yellow-600 dark:text-yellow-400',
      });
    case 'invalid_file':
      return React.createElement(FileX, {
        className: 'w-4 h-4 text-orange-600 dark:text-orange-400',
      });
    case 'blocked_ip':
      return React.createElement(Ban, {
        className: 'w-4 h-4 text-red-600 dark:text-red-400',
      });
    case 'malware_detected':
      return React.createElement(Bug, {
        className: 'w-4 h-4 text-red-700 dark:text-red-500',
      });
    case 'large_file':
      return React.createElement(HardDrive, {
        className: 'w-4 h-4 text-gray-600 dark:text-gray-400',
      });
    case 'access_denied':
      return React.createElement(UserX, {
        className: 'w-4 h-4 text-red-600 dark:text-red-400',
      });
    case 'suspicious_activity':
      return React.createElement(Activity, {
        className: 'w-4 h-4 text-purple-600 dark:text-purple-400',
      });
    case 'system_maintenance':
      return React.createElement(Settings, {
        className: 'w-4 h-4 text-green-600 dark:text-green-400',
      });
    default:
      return React.createElement(Shield, {
        className: 'w-4 h-4 text-blue-600 dark:text-blue-400',
      });
  }
};

export const formatTimestamp = (timestamp: Date | string): string => {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};
