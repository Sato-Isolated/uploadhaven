'use client';

import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NotificationEntity } from '@/lib/notifications/domain/types';

interface NotificationActionsProps {
  notification: NotificationEntity;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  isMarkingAsRead?: boolean;
  isDeleting?: boolean;
  className?: string;
}

/**
 * NotificationActions - Simplified Zero-Knowledge notification actions
 * 
 * Zero-Knowledge Principle: Only basic actions that don't require access to encrypted data
 * - Mark as read/unread (metadata only)
 * - Delete notification (removes from database)
 * - No complex actions that would require decryption keys
 */
export function NotificationActions({
  notification,
  onMarkAsRead,
  onDelete,
  isMarkingAsRead = false,
  isDeleting = false,
  className = '',
}: NotificationActionsProps) {
  // Work directly with domain types (no legacy conversion needed)
  const isUnread = notification.status === 'unread';

  const handleMarkAsRead = () => {
    if (onMarkAsRead && isUnread) {
      onMarkAsRead(notification.id);
    }
  };
  const handleDelete = () => {
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Mark as Read Button - Only show if notification is unread */}
      {isUnread && onMarkAsRead && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAsRead}
          disabled={isMarkingAsRead}
          className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900"
          title="Marquer comme lu"
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
      )}

      {/* Delete Button - Always available */}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
          title="Supprimer la notification"
        >
          <Trash2 className="h-3 w-3 text-red-600" />
        </Button>
      )}
    </div>
  );
}
