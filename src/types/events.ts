/**
 * Events and Activities Types for UploadHaven
 * Handles system events, activities, and security events
 */

import type { PaginationData } from './api';

// =============================================================================
// Base Event Types
// =============================================================================

/**
 * Base event structure
 */
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string | Date;
  details?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical'; // Re-added for compatibility, consider moving to a shared type
  ip?: string;
  userAgent?: string;
}

/**
 * Activity event with file metadata
 */
export interface ActivityEvent extends BaseEvent {
  _id?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
}

/**
 * Activity response with pagination
 */
export interface ActivityResponse {
  activities: ActivityEvent[];
  pagination: PaginationData;
}

// =============================================================================
// Notification System
// =============================================================================

/**
 * Notification types
 */
export type NotificationType =
  | 'file_downloaded'
  | 'file_expired_soon'
  | 'file_shared'
  | 'security_alert'
  | 'system_announcement'
  | 'file_upload_complete'
  | 'bulk_action_complete';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification structure
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;  relatedFileId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Real-time notification event for SSE
 */
export interface NotificationEvent {
  type: 'notification';
  data: Notification;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  byType: Record<NotificationType, number>;
}
