"use client";

import { motion, AnimatePresence } from "motion/react";
import { Bell, BellRing, Check, X, Clock, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/types/events";

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const {
    notifications,
    stats,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead
  } = useNotifications({
    limit: 10,
    includeRead: false, // Only unread for dropdown
    realtime: true
  });

  const unreadCount = stats?.unread || 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-400';
      case 'normal':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400';
      case 'low':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-950 dark:text-gray-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security_alert':
      case 'malware_detected':
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'file_downloaded':
      case 'file_shared':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'file_expired_soon':
        return <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'system_announcement':
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

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
              rotate: isConnected ? 0 : [0, -10, 10, 0]
            }}
            transition={{ 
              duration: unreadCount > 0 ? 0.5 : 2,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 3
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
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Connection status indicator */}
          <div className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-hidden"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingAllAsRead}
                className="h-7 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>                {notifications.map((notification: Notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    isMarkingAsRead={isMarkingAsRead}
                    getPriorityColor={getPriorityColor}
                    getTypeIcon={getTypeIcon}
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
                View All Notifications
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingAsRead: boolean;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isMarkingAsRead,
  getPriorityColor,
  getTypeIcon
}: NotificationItemProps) {
  const handleAction = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {notification.title}
            </p>
            <Badge 
              variant="outline" 
              className={`text-xs ${getPriorityColor(notification.priority)}`}
            >
              {notification.priority}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  disabled={isMarkingAsRead}
                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              {notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction();
                  }}
                  className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  {notification.actionLabel || 'View'}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
