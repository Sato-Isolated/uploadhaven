'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Bell,
  BellRing,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useNotifications, useNotificationStats } from '@/hooks/notifications';
import { NotificationItem } from './display/NotificationItem';
import type { NotificationEntity } from '@/lib/notifications/domain/types';

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const t = useTranslations('Notifications');

  // Use the new focused hooks
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead, } = useNotifications({
      query: {
        limit: 10,
        includeRead: false, // Only unread for dropdown
      },
      realtime: {
        enabled: true,
      },
    });

  // Separate stats hook for better performance
  const { stats } = useNotificationStats();

  // Connection status from the main hook
  const isConnected = true; // TODO: Get from useNotificationConnection hook
  const unreadCount = stats?.unread || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative h-9 w-9 p-0 ${className}`}
        >
          <motion.div
            animate={{
              scale: unreadCount > 0 ? [1, 1.1, 1] : 1,
              rotate: isConnected ? 0 : [0, -10, 10, 0],
            }}
            transition={{
              duration: unreadCount > 0 ? 0.5 : 2,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 3,
            }}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </motion.div>

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="destructive"
                  className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection status indicator */}
          <div
            className={`absolute right-0 bottom-0 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="max-h-96 w-80 overflow-hidden"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="text-sm font-semibold">{t('notifications')}</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingAllAsRead}
                className="h-7 px-2 text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                {t('markAllRead')}
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('loadingNotifications')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('noNotificationsYet')}
              </p>
            </div>          ) : (<div className="divide-y">
            <AnimatePresence>
              {notifications.map((notification: NotificationEntity) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  isMarkingAsRead={isMarkingAsRead}
                />
              ))}
            </AnimatePresence>
          </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center py-2">
              <Button variant="ghost" size="sm" className="w-full">
                {t('viewAllNotifications')}
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>  );
}

export default NotificationDropdown;
