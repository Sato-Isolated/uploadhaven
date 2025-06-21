/**
 * Notification Repository
 * Handles all database operations for notifications with proper error handling
 */

import mongoose from 'mongoose';
import type {
  NotificationEntity,
  CreateNotificationData,
  UpdateNotificationData,
  NotificationFilters,
  NotificationQueryOptions,
  NotificationStats,
  NotificationId,
  UserId,
  INotificationRepository,
} from '../domain/types';
import {
  NotificationNotFoundError,
  NotificationDatabaseError,
  toNotificationError,
} from '../domain/errors';
import { NOTIFICATION_DEFAULTS } from '../domain/constants';

// =============================================================================
// Database Schema
// =============================================================================

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'file_downloaded',
        'file_expired_soon',
        'file_shared',
        'security_alert',
        'malware_detected',
        'system_announcement',
        'file_upload_complete',
        'bulk_action_complete',
        'account_security',
        'admin_alert',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: NOTIFICATION_DEFAULTS.MAX_TITLE_LENGTH,
    },
    message: {
      type: String,
      required: true,
      maxLength: NOTIFICATION_DEFAULTS.MAX_MESSAGE_LENGTH,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'archived'],
      default: 'unread',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    relatedFileId: {
      type: String,
      required: false,
      index: true,
    },
    actionUrl: {
      type: String,
      required: false,
    },
    actionLabel: {
      type: String,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 }); // User notifications by date
notificationSchema.index({ userId: 1, status: 1 }); // User notifications by status
notificationSchema.index({ userId: 1, type: 1 }); // User notifications by type
notificationSchema.index({ userId: 1, priority: 1 }); // User notifications by priority

// TTL index for automatic cleanup of expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// =============================================================================
// Model
// =============================================================================

function getNotificationModel(): mongoose.Model<any> {
  // Check if model already exists to avoid re-compilation
  if (mongoose.models.Notification) {
    return mongoose.models.Notification;
  }
  return mongoose.model('Notification', notificationSchema);
}

// =============================================================================
// Repository Implementation
// =============================================================================

export class NotificationRepository implements INotificationRepository {
  private get model() {
    return getNotificationModel();
  }

  /**
   * Transform database document to domain entity
   */
  private transformToEntity(doc: any): NotificationEntity {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      priority: doc.priority,
      status: doc.status || (doc.isRead ? 'read' : 'unread'), // Backward compatibility
      relatedFileId: doc.relatedFileId,
      actionUrl: doc.actionUrl,
      actionLabel: doc.actionLabel,
      expiresAt: doc.expiresAt,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Build query filter from domain filters
   */
  private buildQueryFilter(filters: NotificationFilters): Record<string, any> {
    const query: Record<string, any> = {};

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.status) {
      // Handle backward compatibility
      if (filters.status === 'read') {
        query.isRead = true;
      } else if (filters.status === 'unread') {
        query.isRead = false;
      } else {
        query.status = filters.status;
      }
    }

    if (filters.relatedFileId) {
      query.relatedFileId = filters.relatedFileId;
    }

    // Handle expiration
    if (!filters.includeExpired) {
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ];
    }

    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo;
      }
    }

    return query;
  }

  /**
   * Find notification by ID
   */
  public async findById(id: NotificationId): Promise<NotificationEntity | null> {
    try {
      const doc = await this.model.findById(id.toString()).lean();
      return doc ? this.transformToEntity(doc) : null;
    } catch (error) {
      throw new NotificationDatabaseError('findById', error as Error);
    }
  }

  /**
   * Find notifications by user ID
   */
  public async findByUserId(
    userId: UserId,
    options: NotificationQueryOptions = {}
  ): Promise<NotificationEntity[]> {
    try {
      const {
        limit = NOTIFICATION_DEFAULTS.LIMIT,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeRead = true,
      } = options;

      const filters: NotificationFilters = {
        userId: userId.toString(),
        status: includeRead ? undefined : 'unread',
        includeExpired: false,
      };

      return this.findByFilters(filters, options);
    } catch (error) {
      throw toNotificationError(error, 'findByUserId');
    }
  }

  /**
   * Find notifications by filters
   */
  public async findByFilters(
    filters: NotificationFilters,
    options: NotificationQueryOptions = {}
  ): Promise<NotificationEntity[]> {
    try {
      const {
        limit = NOTIFICATION_DEFAULTS.LIMIT,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;      const query = this.buildQueryFilter(filters);
      const sortDirection = sortOrder === 'desc' ? -1 : 1;

      const docs = await this.model
        .find(query)
        .sort({ [sortBy]: sortDirection } as any)
        .limit(limit)
        .skip(offset)
        .lean();

      return docs.map((doc) => this.transformToEntity(doc));
    } catch (error) {
      throw new NotificationDatabaseError('findByFilters', error as Error);
    }
  }

  /**
   * Create new notification
   */
  public async create(data: CreateNotificationData): Promise<NotificationEntity> {
    try {
      const doc = new this.model({
        ...data,
        status: 'unread',
        isRead: false, // Backward compatibility
      });

      await doc.save();
      return this.transformToEntity(doc.toObject());
    } catch (error) {
      throw new NotificationDatabaseError('create', error as Error);
    }
  }

  /**
   * Update notification
   */
  public async update(
    id: NotificationId,
    data: UpdateNotificationData
  ): Promise<NotificationEntity | null> {
    try {
      const updateData: any = { ...data };

      // Handle status backward compatibility
      if (data.status === 'read') {
        updateData.isRead = true;
      } else if (data.status === 'unread') {
        updateData.isRead = false;
      }

      const doc = await this.model
        .findByIdAndUpdate(id.toString(), updateData, { new: true })
        .lean();

      return doc ? this.transformToEntity(doc) : null;
    } catch (error) {
      throw new NotificationDatabaseError('update', error as Error);
    }
  }

  /**
   * Delete notification
   */
  public async delete(id: NotificationId): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndDelete(id.toString());
      return result !== null;
    } catch (error) {
      throw new NotificationDatabaseError('delete', error as Error);
    }
  }

  /**
   * Get notification statistics for user
   */
  public async getStats(userId: UserId): Promise<NotificationStats> {
    try {
      const now = new Date();
      const userIdStr = userId.toString();

      const [total, unread, byPriority, byType, byStatus] = await Promise.all([
        // Total notifications (non-expired)
        this.model.countDocuments({
          userId: userIdStr,
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
        }),

        // Unread notifications
        this.model.countDocuments({
          userId: userIdStr,
          $or: [
            { isRead: false }, // Backward compatibility
            { status: 'unread' },
          ],
          $and: [
            {
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } },
              ],
            },
          ],
        }),

        // By priority
        this.model.aggregate([
          {
            $match: {
              userId: userIdStr,
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } },
              ],
            },
          },
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ]),

        // By type
        this.model.aggregate([
          {
            $match: {
              userId: userIdStr,
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } },
              ],
            },
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
        ]),

        // By status
        this.model.aggregate([
          {
            $match: {
              userId: userIdStr,
              $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } },
              ],
            },
          },
          {
            $group: {
              _id: {
                $cond: {
                  if: { $eq: ['$isRead', true] },
                  then: 'read',
                  else: { $ifNull: ['$status', 'unread'] },
                },
              },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      // Process aggregation results
      const priorityStats = {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0,
      };
      byPriority.forEach((item: { _id: string; count: number }) => {
        if (item._id && item._id in priorityStats) {
          priorityStats[item._id as keyof typeof priorityStats] = item.count;
        }
      });

      const typeStats: Record<string, number> = {};
      byType.forEach((item: { _id: string; count: number }) => {
        if (item._id) {
          typeStats[item._id] = item.count;
        }
      });

      const statusStats = {
        unread: 0,
        read: 0,
        archived: 0,
      };
      byStatus.forEach((item: { _id: string; count: number }) => {
        if (item._id && item._id in statusStats) {
          statusStats[item._id as keyof typeof statusStats] = item.count;
        }
      });

      return {
        total,
        unread,
        byPriority: priorityStats,
        byType: typeStats as any, // Type assertion needed for generic Record
        byStatus: statusStats,
      };
    } catch (error) {
      throw new NotificationDatabaseError('getStats', error as Error);
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(id: NotificationId, userId: UserId): Promise<boolean> {
    try {
      const result = await this.model.findOneAndUpdate(
        { _id: id.toString(), userId: userId.toString() },
        { status: 'read', isRead: true }, // Backward compatibility
        { new: true }
      );
      return result !== null;
    } catch (error) {
      throw new NotificationDatabaseError('markAsRead', error as Error);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  public async markAllAsRead(userId: UserId): Promise<number> {
    try {
      const result = await this.model.updateMany(
        { 
          userId: userId.toString(),
          $or: [
            { status: 'unread' },
            { isRead: false }, // Backward compatibility
          ],
        },
        { status: 'read', isRead: true }
      );
      return result.modifiedCount || 0;
    } catch (error) {
      throw new NotificationDatabaseError('markAllAsRead', error as Error);
    }
  }

  /**
   * Delete expired notifications
   */
  public async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.model.deleteMany({
        expiresAt: { $exists: true, $lt: now },
      });
      return result.deletedCount || 0;
    } catch (error) {
      throw new NotificationDatabaseError('deleteExpired', error as Error);
    }
  }
}
