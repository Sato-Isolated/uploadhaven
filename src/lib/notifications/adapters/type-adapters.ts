/**
 * Notification Type Adapters
 * 
 * Single Responsibility: Bridge the gap between domain types and legacy types
 * - Converts between NotificationEntity (domain) and Notification (legacy)
 * - Provides backward compatibility during migration
 * - Handles type mapping and transformation logic
 */

import type { NotificationEntity, NotificationStatus } from '../domain/types';
import type { Notification } from '@/types/events';

// =============================================================================
// Type Adapters
// =============================================================================

/**
 * Convert domain NotificationEntity to legacy Notification format
 */
export function toLegacyNotification(entity: NotificationEntity): Notification {
  return {
    id: entity.id,
    userId: entity.userId,
    type: entity.type,
    title: entity.title,
    message: entity.message,
    isRead: entity.status === 'read',
    priority: entity.priority,
    relatedFileId: entity.relatedFileId,
    actionUrl: entity.actionUrl,
    actionLabel: entity.actionLabel,
    expiresAt: entity.expiresAt,
    metadata: entity.metadata,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

/**
 * Convert legacy Notification to domain NotificationEntity format
 */
export function toDomainEntity(notification: Notification): NotificationEntity {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    status: notification.isRead ? 'read' : 'unread',
    priority: notification.priority,
    relatedFileId: notification.relatedFileId,
    actionUrl: notification.actionUrl,
    actionLabel: notification.actionLabel,
    expiresAt: notification.expiresAt,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

/**
 * Convert array of domain entities to legacy notifications
 */
export function toLegacyNotifications(entities: NotificationEntity[]): Notification[] {
  return entities.map(toLegacyNotification);
}

/**
 * Convert array of legacy notifications to domain entities
 */
export function toDomainEntities(notifications: Notification[]): NotificationEntity[] {
  return notifications.map(toDomainEntity);
}

/**
 * Convert NotificationStatus to isRead boolean
 */
export function statusToIsRead(status: NotificationStatus): boolean {
  return status === 'read';
}

/**
 * Convert isRead boolean to NotificationStatus
 */
export function isReadToStatus(isRead: boolean): NotificationStatus {
  return isRead ? 'read' : 'unread';
}

/**
 * Check if a notification is unread (works with both formats)
 */
export function isNotificationUnread(notification: Notification | NotificationEntity): boolean {
  if ('isRead' in notification) {
    return !notification.isRead;
  }
  return notification.status === 'unread';
}

/**
 * Get display status text for a notification
 */
export function getNotificationStatusText(notification: Notification | NotificationEntity): string {
  if ('isRead' in notification) {
    return notification.isRead ? 'Read' : 'Unread';
  }
  
  switch (notification.status) {
    case 'read':
      return 'Read';
    case 'unread':
      return 'Unread';
    case 'archived':
      return 'Archived';
    default:
      return 'Unknown';
  }
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if object is legacy Notification
 */
export function isLegacyNotification(obj: any): obj is Notification {
  return obj && typeof obj === 'object' && 'isRead' in obj && typeof obj.isRead === 'boolean';
}

/**
 * Type guard to check if object is domain NotificationEntity
 */
export function isDomainEntity(obj: any): obj is NotificationEntity {
  return obj && typeof obj === 'object' && 'status' in obj && typeof obj.status === 'string';
}

// =============================================================================
// Migration Utilities
// =============================================================================

/**
 * Safely convert unknown notification format to domain entity
 */
export function ensureDomainEntity(notification: Notification | NotificationEntity): NotificationEntity {
  if (isDomainEntity(notification)) {
    return notification;
  }
  
  if (isLegacyNotification(notification)) {
    return toDomainEntity(notification);
  }
  
  throw new Error('Invalid notification format');
}

/**
 * Safely convert unknown notification format to legacy notification
 */
export function ensureLegacyNotification(notification: Notification | NotificationEntity): Notification {
  if (isLegacyNotification(notification)) {
    return notification;
  }
  
  if (isDomainEntity(notification)) {
    return toLegacyNotification(notification);
  }
  
  throw new Error('Invalid notification format');
}

/**
 * Convert mixed array of notifications to consistent format
 */
export function normalizeNotifications<T extends 'domain' | 'legacy'>(
  notifications: (Notification | NotificationEntity)[],
  targetFormat: T
): T extends 'domain' ? NotificationEntity[] : Notification[] {
  if (targetFormat === 'domain') {
    return notifications.map(ensureDomainEntity) as any;
  } else {
    return notifications.map(ensureLegacyNotification) as any;
  }
}

export default {
  toLegacyNotification,
  toDomainEntity,
  toLegacyNotifications,
  toDomainEntities,
  statusToIsRead,
  isReadToStatus,
  isNotificationUnread,
  getNotificationStatusText,
  isLegacyNotification,
  isDomainEntity,
  ensureDomainEntity,
  ensureLegacyNotification,
  normalizeNotifications,
};
