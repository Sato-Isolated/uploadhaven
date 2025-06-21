'use client';

import React from 'react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { NotificationIcon } from './NotificationIcon';
import { NotificationActions } from '../actions/NotificationActions';
import type { NotificationEntity } from '@/lib/notifications/domain/types';

interface NotificationItemProps {
  notification: NotificationEntity;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  isMarkingAsRead?: boolean;
  isDeleting?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * NotificationItem - Simplified Zero-Knowledge notification display
 * 
 * Zero-Knowledge Principle: Display only metadata, no encrypted content
 * - Shows notification title, type, and timestamp (all public metadata)
 * - Provides basic actions: mark as read, delete
 * - No complex actions that would require access to encrypted data
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isMarkingAsRead = false,
  isDeleting = false,
  showActions = true,
  compact = false,
  className = '',
}: NotificationItemProps) {
  // Work directly with domain types (no legacy conversion needed)
  const isUnread = notification.status === 'unread';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'low':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.2 }}
      className={`group relative ${className}`}
    >
      <div        className={`
          border-l-4 p-3 transition-all duration-200
          ${getPriorityColor(notification.priority)}
          ${isUnread ? 'bg-opacity-100' : 'bg-opacity-50'}
          ${compact ? 'p-2' : 'p-3'}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Notification Icon */}
          <div className="flex-shrink-0">            <NotificationIcon 
              type={notification.type} 
              priority={notification.priority}
              size={compact ? 16 : 20}
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header with title and timestamp */}
            <div className="flex items-center justify-between gap-2">
              <h4 className={`font-medium ${isUnread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                {notification.title}
              </h4>
              
              {/* Priority Badge */}
              {notification.priority !== 'normal' && (
                <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}>
                  {notification.priority}
                </Badge>
              )}
            </div>

            {/* Message */}
            <p className={`mt-1 text-sm ${isUnread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
              {notification.message}
            </p>

            {/* Footer with timestamp and actions */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>

              {/* Actions - Simplified for Zero-Knowledge */}
              {showActions && (
                <NotificationActions
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  isMarkingAsRead={isMarkingAsRead}
                  isDeleting={isDeleting}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default NotificationItem;
