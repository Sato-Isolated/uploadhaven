'use client';

import React from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  Shield,
  Download,
  Share,
  Archive,
} from 'lucide-react';

interface NotificationIconProps {
  type: string;
  priority?: string;
  className?: string;
  size?: number;
}

/**
 * NotificationIcon - Focused component for displaying type-specific notification icons
 * 
 * Single Responsibility: Render appropriate icon based on notification type
 * - Maps notification types to specific icons
 * - Applies priority-based styling
 * - Provides consistent icon sizing and colors
 */
export function NotificationIcon({
  type,
  priority = 'normal',
  className = '',
  size = 16,
}: NotificationIconProps) {
  const getIconColor = (notificationType: string, notificationPriority: string) => {
    // Priority-based coloring for security alerts
    if (notificationType.includes('security') || notificationType.includes('malware')) {
      switch (notificationPriority) {
        case 'urgent':
          return 'text-red-600 dark:text-red-400';
        case 'high':
          return 'text-orange-600 dark:text-orange-400';
        default:
          return 'text-red-500 dark:text-red-500';
      }
    }

    // Type-based coloring for other notifications
    switch (notificationType) {
      case 'file_downloaded':
      case 'file_shared':
      case 'file_uploaded':
        return 'text-green-600 dark:text-green-400';
      case 'file_expired_soon':
      case 'file_expiring':
        return 'text-orange-600 dark:text-orange-400';
      case 'system_announcement':
      case 'system_update':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getIcon = (notificationType: string) => {
    const iconProps = {
      size,
      className: `${getIconColor(notificationType, priority)} ${className}`,
    };

    switch (notificationType) {
      case 'security_alert':
      case 'malware_detected':
      case 'unauthorized_access':
        return <AlertTriangle {...iconProps} />;
      
      case 'file_downloaded':
        return <Download {...iconProps} />;
      
      case 'file_shared':
        return <Share {...iconProps} />;
      
      case 'file_uploaded':
      case 'file_created':
        return <CheckCircle {...iconProps} />;
      
      case 'file_expired_soon':
      case 'file_expiring':
        return <Clock {...iconProps} />;
      
      case 'file_expired':
      case 'file_deleted':
        return <Archive {...iconProps} />;
      
      case 'system_announcement':
      case 'system_update':
        return <Info {...iconProps} />;
      
      case 'security_scan_complete':
      case 'security_update':
        return <Shield {...iconProps} />;
      
      default:
        return <Bell {...iconProps} />;
    }
  };

  return getIcon(type);
}

export default NotificationIcon;
