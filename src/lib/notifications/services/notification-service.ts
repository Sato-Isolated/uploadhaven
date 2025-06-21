/**
 * Notification Service
 * Core business logic for notification operations
 */

import type {
  NotificationEntity,
  CreateNotificationData,
  NotificationStats,
  NotificationQueryOptions,
  INotificationService,
  INotificationRepository,
  INotificationBroadcaster,
} from '../domain/types';
import {
  NotificationId,
  UserId,
} from '../domain/types';
import {
  NotificationNotFoundError,
  UnauthorizedAccessError,
  NotificationExpiredError,
  toNotificationError,
} from '../domain/errors';
import { 
  getDefaultExpirationDate,
  getNotificationConfig,
  NOTIFICATION_DEFAULTS,
} from '../domain/constants';
import { NotificationValidationService } from './notification-validator';

// =============================================================================
// Service Implementation
// =============================================================================

export class NotificationService implements INotificationService {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly validator: NotificationValidationService,
    private readonly broadcaster?: INotificationBroadcaster
  ) {}

  /**
   * Create a new notification
   */
  public async createNotification(data: CreateNotificationData): Promise<NotificationEntity> {
    try {
      // Validate input data
      const validatedData = this.validator.validateCreateData(data);
      
      // Sanitize input
      const sanitizedData = this.validator.sanitizeCreateData(validatedData);
      
      // Apply business rules
      const enrichedData = this.enrichNotificationData(sanitizedData);
      
      // Create notification in repository
      const notification = await this.repository.create(enrichedData);
      
      // Broadcast real-time notification if broadcaster is available
      if (this.broadcaster) {
        await this.broadcaster.broadcast(
          new UserId(notification.userId),
          {
            type: 'notification_created',
            data: notification,
            timestamp: new Date(),
          }
        );
      }
      
      return notification;
    } catch (error) {
      throw toNotificationError(error, 'createNotification');
    }
  }

  /**
   * Get notifications for a user
   */
  public async getNotifications(
    userId: UserId,
    options: NotificationQueryOptions = {}
  ): Promise<NotificationEntity[]> {
    try {
      // Validate user ID
      this.validator.validateUserId(userId.toString());
      
      // Validate query options
      const validatedOptions = this.validator.validateQueryOptions(options);
      
      // Get notifications from repository
      const notifications = await this.repository.findByUserId(userId, validatedOptions);
      
      // Filter out expired notifications if needed
      const now = new Date();
      return notifications.filter(notification => {
        if (!notification.expiresAt) return true;
        return notification.expiresAt > now;
      });
    } catch (error) {
      throw toNotificationError(error, 'getNotifications');
    }
  }

  /**
   * Get notification statistics for a user
   */
  public async getNotificationStats(userId: UserId): Promise<NotificationStats> {
    try {
      // Validate user ID
      this.validator.validateUserId(userId.toString());
      
      // Get stats from repository
      return await this.repository.getStats(userId);
    } catch (error) {
      throw toNotificationError(error, 'getNotificationStats');
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(id: NotificationId, userId: UserId): Promise<void> {
    try {
      // Validate IDs
      this.validator.validateNotificationId(id.toString());
      this.validator.validateUserId(userId.toString());
      
      // Check if notification exists and belongs to user
      const notification = await this.repository.findById(id);
      if (!notification) {
        throw new NotificationNotFoundError(id);
      }
      
      if (notification.userId !== userId.toString()) {
        throw new UnauthorizedAccessError(userId, id);
      }
      
      // Check if notification is expired
      if (notification.expiresAt && notification.expiresAt <= new Date()) {
        throw new NotificationExpiredError(id, notification.expiresAt);
      }
      
      // Mark as read in repository
      const success = await this.repository.markAsRead(id, userId);
      if (!success) {
        throw new NotificationNotFoundError(id);
      }
      
      // Broadcast update if broadcaster is available
      if (this.broadcaster) {
        const updatedNotification = await this.repository.findById(id);
        if (updatedNotification) {
          await this.broadcaster.broadcast(
            userId,
            {
              type: 'notification_updated',
              data: updatedNotification,
              timestamp: new Date(),
            }
          );
        }
      }
    } catch (error) {
      throw toNotificationError(error, 'markAsRead');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: UserId): Promise<void> {
    try {
      // Validate user ID
      this.validator.validateUserId(userId.toString());
      
      // Mark all as read in repository
      await this.repository.markAllAsRead(userId);
      
      // Note: We don't broadcast individual updates for bulk operations
      // to avoid overwhelming the real-time system
    } catch (error) {
      throw toNotificationError(error, 'markAllAsRead');
    }
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(id: NotificationId, userId: UserId): Promise<void> {
    try {
      // Validate IDs
      this.validator.validateNotificationId(id.toString());
      this.validator.validateUserId(userId.toString());
      
      // Check if notification exists and belongs to user
      const notification = await this.repository.findById(id);
      if (!notification) {
        throw new NotificationNotFoundError(id);
      }
      
      if (notification.userId !== userId.toString()) {
        throw new UnauthorizedAccessError(userId, id);
      }
      
      // Delete from repository
      const success = await this.repository.delete(id);
      if (!success) {
        throw new NotificationNotFoundError(id);
      }
      
      // Broadcast deletion if broadcaster is available
      if (this.broadcaster) {
        await this.broadcaster.broadcast(
          userId,
          {
            type: 'notification_deleted',
            data: notification,
            timestamp: new Date(),
          }
        );
      }
    } catch (error) {
      throw toNotificationError(error, 'deleteNotification');
    }
  }

  /**
   * Get a single notification by ID
   */
  public async getNotificationById(id: NotificationId, userId: UserId): Promise<NotificationEntity> {
    try {
      // Validate IDs
      this.validator.validateNotificationId(id.toString());
      this.validator.validateUserId(userId.toString());
      
      // Get notification from repository
      const notification = await this.repository.findById(id);
      if (!notification) {
        throw new NotificationNotFoundError(id);
      }
      
      // Check ownership
      if (notification.userId !== userId.toString()) {
        throw new UnauthorizedAccessError(userId, id);
      }
      
      // Check expiration
      if (notification.expiresAt && notification.expiresAt <= new Date()) {
        throw new NotificationExpiredError(id, notification.expiresAt);
      }
      
      return notification;
    } catch (error) {
      throw toNotificationError(error, 'getNotificationById');
    }
  }

  /**
   * Bulk mark notifications as read
   */
  public async bulkMarkAsRead(ids: string[], userId: UserId): Promise<void> {
    try {
      // Validate user ID
      this.validator.validateUserId(userId.toString());
      
      // Validate notification IDs
      const validatedIds = this.validator.validateBulkIds(ids);
      
      // Process each notification
      const promises = validatedIds.map(id => 
        this.markAsRead(new NotificationId(id), userId).catch(error => {
          // Log error but don't fail the entire operation
          console.error(`Failed to mark notification ${id} as read:`, error);
          return null;
        })
      );
      
      await Promise.allSettled(promises);
    } catch (error) {
      throw toNotificationError(error, 'bulkMarkAsRead');
    }
  }

  /**
   * Bulk delete notifications
   */
  public async bulkDelete(ids: string[], userId: UserId): Promise<void> {
    try {
      // Validate user ID
      this.validator.validateUserId(userId.toString());
      
      // Validate notification IDs
      const validatedIds = this.validator.validateBulkIds(ids);
      
      // Process each notification
      const promises = validatedIds.map(id => 
        this.deleteNotification(new NotificationId(id), userId).catch(error => {
          // Log error but don't fail the entire operation
          console.error(`Failed to delete notification ${id}:`, error);
          return null;
        })
      );
      
      await Promise.allSettled(promises);
    } catch (error) {
      throw toNotificationError(error, 'bulkDelete');
    }
  }

  /**
   * Clean up expired notifications (admin operation)
   */
  public async cleanupExpiredNotifications(): Promise<number> {
    try {
      return await this.repository.deleteExpired();
    } catch (error) {
      throw toNotificationError(error, 'cleanupExpiredNotifications');
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Enrich notification data with business rules
   */
  private enrichNotificationData(data: CreateNotificationData): CreateNotificationData {
    const config = getNotificationConfig(data.type);
    
    return {
      ...data,
      // Set default priority if not provided
      priority: data.priority || config.priority || NOTIFICATION_DEFAULTS.PRIORITY,
      // Set default expiration if not provided
      expiresAt: data.expiresAt || getDefaultExpirationDate(data.type),
      // Ensure metadata is an object
      metadata: {
        ...data.metadata,
        // Add system metadata
        createdBy: 'system',
        notificationCategory: config.category,
        autoGenerated: true,
      },
    };
  }

  /**
   * Check if user has permission to access notification
   */
  private async checkNotificationAccess(
    notificationId: NotificationId,
    userId: UserId
  ): Promise<NotificationEntity> {
    const notification = await this.repository.findById(notificationId);
    
    if (!notification) {
      throw new NotificationNotFoundError(notificationId);
    }
    
    if (notification.userId !== userId.toString()) {
      throw new UnauthorizedAccessError(userId, notificationId);
    }
    
    if (notification.expiresAt && notification.expiresAt <= new Date()) {
      throw new NotificationExpiredError(notificationId, notification.expiresAt);
    }
    
    return notification;
  }
}
