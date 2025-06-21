/**
 * Notification Domain Types
 * Core notification types following domain-driven design principles
 */

// =============================================================================
// Core Domain Types
// =============================================================================

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification types
 */
export type NotificationType =
  | 'file_downloaded'
  | 'file_expired_soon'
  | 'file_shared'
  | 'security_alert'
  | 'malware_detected'
  | 'system_announcement'
  | 'file_upload_complete'
  | 'bulk_action_complete'
  | 'account_security'
  | 'admin_alert';

/**
 * Notification status
 */
export type NotificationStatus = 'unread' | 'read' | 'archived';

/**
 * Core notification entity
 */
export interface NotificationEntity {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly priority: NotificationPriority;
  readonly status: NotificationStatus;
  readonly relatedFileId?: string;
  readonly actionUrl?: string;
  readonly actionLabel?: string;
  readonly expiresAt?: Date;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Notification creation data
 */
export interface CreateNotificationData {
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly priority?: NotificationPriority;
  readonly relatedFileId?: string;
  readonly actionUrl?: string;
  readonly actionLabel?: string;
  readonly expiresAt?: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Notification update data
 */
export interface UpdateNotificationData {
  readonly status?: NotificationStatus;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Notification query filters
 */
export interface NotificationFilters {
  readonly userId?: string;
  readonly type?: NotificationType;
  readonly priority?: NotificationPriority;
  readonly status?: NotificationStatus;
  readonly relatedFileId?: string;
  readonly includeExpired?: boolean;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

/**
 * Notification query options
 */
export interface NotificationQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  readonly sortOrder?: 'asc' | 'desc';
  readonly includeRead?: boolean;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  readonly total: number;
  readonly unread: number;
  readonly byPriority: Record<NotificationPriority, number>;
  readonly byType: Record<NotificationType, number>;
  readonly byStatus: Record<NotificationStatus, number>;
}

/**
 * Real-time notification event
 */
export interface NotificationEvent {
  readonly type: 'notification_created' | 'notification_updated' | 'notification_deleted';
  readonly data: NotificationEntity;
  readonly timestamp: Date;
}

/**
 * SSE connection state
 */
export interface SSEConnectionState {
  readonly isConnected: boolean;
  readonly connectionError: string | null;
  readonly reconnectAttempts: number;
  readonly lastConnectedAt?: Date;
}

// =============================================================================
// Value Objects
// =============================================================================

/**
 * Notification ID value object
 */
export class NotificationId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Notification ID cannot be empty');
    }
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: NotificationId): boolean {
    return this.value === other.value;
  }
}

/**
 * User ID value object
 */
export class UserId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }
}

// =============================================================================
// Domain Services Interfaces
// =============================================================================

/**
 * Notification repository interface
 */
export interface INotificationRepository {
  findById(id: NotificationId): Promise<NotificationEntity | null>;
  findByUserId(userId: UserId, options?: NotificationQueryOptions): Promise<NotificationEntity[]>;
  findByFilters(filters: NotificationFilters, options?: NotificationQueryOptions): Promise<NotificationEntity[]>;
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  update(id: NotificationId, data: UpdateNotificationData): Promise<NotificationEntity | null>;
  delete(id: NotificationId): Promise<boolean>;
  getStats(userId: UserId): Promise<NotificationStats>;
  markAsRead(id: NotificationId, userId: UserId): Promise<boolean>;
  markAllAsRead(userId: UserId): Promise<number>;
  deleteExpired(): Promise<number>;
}

/**
 * Notification service interface
 */
export interface INotificationService {
  createNotification(data: CreateNotificationData): Promise<NotificationEntity>;
  getNotifications(userId: UserId, options?: NotificationQueryOptions): Promise<NotificationEntity[]>;
  getNotificationStats(userId: UserId): Promise<NotificationStats>;
  markAsRead(id: NotificationId, userId: UserId): Promise<void>;
  markAllAsRead(userId: UserId): Promise<void>;
  deleteNotification(id: NotificationId, userId: UserId): Promise<void>;
}

/**
 * Notification broadcaster interface (for real-time)
 */
export interface INotificationBroadcaster {
  broadcast(userId: UserId, event: NotificationEvent): Promise<void>;
  subscribe(userId: UserId, callback: (event: NotificationEvent) => void): () => void;
  unsubscribe(userId: UserId): void;
}
