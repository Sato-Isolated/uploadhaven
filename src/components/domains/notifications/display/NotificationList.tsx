'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import type { NotificationEntity } from '@/lib/notifications/domain/types';

interface NotificationListProps {
  notifications: NotificationEntity[];
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  isLoading?: boolean;
  isMarkingAsRead?: string | null; // ID of notification being marked as read
  isDeleting?: string | null; // ID of notification being deleted
  isMarkingAllAsRead?: boolean;
  showActions?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * NotificationList - Simplified Zero-Knowledge notification list
 * 
 * Zero-Knowledge Principle: Only basic notification management without complex actions
 * - Displays notifications with minimal metadata
 * - Supports only read/delete operations (no content-dependent actions)
 * - Handles empty state and loading states
 * - Provides mark all as read functionality
 * - Manages consistent spacing and animations
 */
export function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
  isLoading = false,
  isMarkingAsRead = null,
  isDeleting = null,
  isMarkingAllAsRead = false,
  showActions = true,
  compact = false,
  emptyMessage,
  className = '',
}: NotificationListProps) {
  const t = useTranslations('Notifications');
  const defaultEmptyMessage = emptyMessage || t('noNotifications');
  const hasUnreadNotifications = notifications.some(n => n.status === 'unread');

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {defaultEmptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header with mark all as read */}
      {showActions && hasUnreadNotifications && onMarkAllAsRead && (
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('notifications')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAllAsRead}
            className="text-xs"
          >
            {isMarkingAllAsRead ? t('markingAllAsRead') : t('markAllAsRead')}
          </Button>
        </div>
      )}

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.2,
                delay: index * 0.05, // Stagger animation
              }}
              className={index < notifications.length - 1 ? 'border-b' : ''}
            >              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                isMarkingAsRead={isMarkingAsRead === notification.id}
                isDeleting={isDeleting === notification.id}
                showActions={showActions}
                compact={compact}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer - could show pagination or load more */}
      {notifications.length > 0 && (
        <div className="border-t p-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('notificationCount', { count: notifications.length })}
          </p>
        </div>
      )}
    </div>
  );
}

export default NotificationList;
