/**
 * Notification Domain Constants
 * Configuration and constants for the notification system
 */

import type { NotificationPriority, NotificationType } from './types';

// =============================================================================
// Notification Configuration
// =============================================================================

/**
 * Default notification settings
 */
export const NOTIFICATION_DEFAULTS = {
  PRIORITY: 'normal' as NotificationPriority,
  LIMIT: 50,
  EXPIRATION_HOURS: 720, // 30 days
  MAX_MESSAGE_LENGTH: 500,
  MAX_TITLE_LENGTH: 100,
} as const;

/**
 * Notification priorities in order of importance
 */
export const PRIORITY_ORDER: NotificationPriority[] = ['low', 'normal', 'high', 'urgent'];

/**
 * Priority levels with their numeric values for sorting
 */
export const PRIORITY_LEVELS: Record<NotificationPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
} as const;

/**
 * Notification type categories
 */
export const NOTIFICATION_CATEGORIES = {
  FILE: ['file_downloaded', 'file_expired_soon', 'file_shared', 'file_upload_complete'] as NotificationType[],
  SECURITY: ['security_alert', 'malware_detected', 'account_security'] as NotificationType[],
  SYSTEM: ['system_announcement', 'admin_alert'] as NotificationType[],
  BULK: ['bulk_action_complete'] as NotificationType[],
} as const;

/**
 * Notification type configurations
 */
export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  priority: NotificationPriority;
  category: keyof typeof NOTIFICATION_CATEGORIES;
  icon: string;
  color: string;
  defaultExpiration?: number; // hours
}> = {
  file_downloaded: {
    priority: 'normal',
    category: 'FILE',
    icon: 'download',
    color: 'blue',
    defaultExpiration: 168, // 7 days
  },
  file_expired_soon: {
    priority: 'high',
    category: 'FILE',
    icon: 'clock',
    color: 'orange',
    defaultExpiration: 24, // 1 day
  },
  file_shared: {
    priority: 'normal',
    category: 'FILE',
    icon: 'share',
    color: 'green',
    defaultExpiration: 168, // 7 days
  },
  file_upload_complete: {
    priority: 'low',
    category: 'FILE',
    icon: 'upload',
    color: 'green',
    defaultExpiration: 24, // 1 day
  },
  security_alert: {
    priority: 'urgent',
    category: 'SECURITY',
    icon: 'shield-alert',
    color: 'red',
    defaultExpiration: 720, // 30 days
  },
  malware_detected: {
    priority: 'urgent',
    category: 'SECURITY',
    icon: 'virus',
    color: 'red',
    defaultExpiration: 720, // 30 days
  },
  account_security: {
    priority: 'high',
    category: 'SECURITY',
    icon: 'user-shield',
    color: 'orange',
    defaultExpiration: 720, // 30 days
  },
  system_announcement: {
    priority: 'normal',
    category: 'SYSTEM',
    icon: 'megaphone',
    color: 'blue',
    defaultExpiration: 720, // 30 days
  },
  admin_alert: {
    priority: 'high',
    category: 'SYSTEM',
    icon: 'admin',
    color: 'purple',
    defaultExpiration: 720, // 30 days
  },
  bulk_action_complete: {
    priority: 'low',
    category: 'BULK',
    icon: 'check-circle',
    color: 'green',
    defaultExpiration: 24, // 1 day
  },
} as const;

// =============================================================================
// SSE Configuration
// =============================================================================

/**
 * Server-Sent Events configuration
 */
export const SSE_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_DELAY: 1000, // 1 second initial delay
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_BACKOFF_MULTIPLIER: 2,
  MAX_RECONNECT_DELAY: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 60000, // 1 minute
} as const;

/**
 * SSE event types
 */
export const SSE_EVENTS = {
  CONNECTED: 'connected',
  NOTIFICATION: 'notification',
  HEARTBEAT: 'heartbeat',
  ERROR: 'error',
} as const;

// =============================================================================
// Database Configuration
// =============================================================================

/**
 * Database collection names
 */
export const COLLECTIONS = {
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Database indexes
 */
export const NOTIFICATION_INDEXES = [
  { userId: 1, createdAt: -1 }, // User notifications sorted by date
  { userId: 1, status: 1 }, // User notifications by status
  { userId: 1, type: 1 }, // User notifications by type
  { userId: 1, priority: 1 }, // User notifications by priority
  { expiresAt: 1 }, // TTL index for automatic cleanup
  { relatedFileId: 1 }, // File-related notifications
] as const;

// =============================================================================
// Validation Rules
// =============================================================================

/**
 * Validation rules for notifications
 */
export const VALIDATION_RULES = {
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: NOTIFICATION_DEFAULTS.MAX_TITLE_LENGTH,
  },
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: NOTIFICATION_DEFAULTS.MAX_MESSAGE_LENGTH,
  },
  USER_ID: {
    PATTERN: /^[a-zA-Z0-9]{24}$/, // MongoDB ObjectId pattern
  },
  NOTIFICATION_ID: {
    PATTERN: /^[a-zA-Z0-9]{24}$/, // MongoDB ObjectId pattern
  },
} as const;

// =============================================================================
// Error Codes
// =============================================================================

/**
 * Notification-specific error codes
 */
export const ERROR_CODES = {
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  INVALID_USER_ID: 'INVALID_USER_ID',
  INVALID_NOTIFICATION_ID: 'INVALID_NOTIFICATION_ID',
  INVALID_NOTIFICATION_TYPE: 'INVALID_NOTIFICATION_TYPE',
  INVALID_PRIORITY: 'INVALID_PRIORITY',
  TITLE_TOO_LONG: 'TITLE_TOO_LONG',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  NOTIFICATION_EXPIRED: 'NOTIFICATION_EXPIRED',
  SSE_CONNECTION_FAILED: 'SSE_CONNECTION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get notification type configuration
 */
export function getNotificationConfig(type: NotificationType) {
  return NOTIFICATION_TYPE_CONFIG[type];
}

/**
 * Get priority level for sorting
 */
export function getPriorityLevel(priority: NotificationPriority): number {
  return PRIORITY_LEVELS[priority];
}

/**
 * Check if notification type is in category
 */
export function isNotificationInCategory(
  type: NotificationType,
  category: keyof typeof NOTIFICATION_CATEGORIES
): boolean {
  return NOTIFICATION_CATEGORIES[category].includes(type);
}

/**
 * Get default expiration date for notification type
 */
export function getDefaultExpirationDate(type: NotificationType): Date {
  const config = NOTIFICATION_TYPE_CONFIG[type];
  const hours = config.defaultExpiration || NOTIFICATION_DEFAULTS.EXPIRATION_HOURS;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Calculate reconnect delay with exponential backoff
 */
export function calculateReconnectDelay(attempts: number): number {
  const delay = SSE_CONFIG.RECONNECT_DELAY * Math.pow(SSE_CONFIG.RECONNECT_BACKOFF_MULTIPLIER, attempts);
  return Math.min(delay, SSE_CONFIG.MAX_RECONNECT_DELAY);
}
