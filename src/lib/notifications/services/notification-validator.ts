/**
 * Notification Validation Service
 * Handles validation of notification data according to business rules
 */

import { z } from 'zod';
import type {
  CreateNotificationData,
  UpdateNotificationData,
  NotificationFilters,
  NotificationQueryOptions,
  NotificationType,
  NotificationPriority,
} from '../domain/types';
import {
  NotificationValidationError,
  InvalidNotificationTypeError,
  InvalidPriorityError,
  createTitleValidationError,
  createMessageValidationError,
  createUserIdValidationError,
  createNotificationIdValidationError,
} from '../domain/errors';
import { VALIDATION_RULES, NOTIFICATION_TYPE_CONFIG } from '../domain/constants';

// =============================================================================
// Zod Schemas
// =============================================================================

/**
 * User ID validation schema
 */
const userIdSchema = z.string().regex(
  VALIDATION_RULES.USER_ID.PATTERN,
  'User ID must be a valid MongoDB ObjectId'
);

/**
 * Notification ID validation schema
 */
const notificationIdSchema = z.string().regex(
  VALIDATION_RULES.NOTIFICATION_ID.PATTERN,
  'Notification ID must be a valid MongoDB ObjectId'
);

/**
 * Notification type validation schema
 */
const notificationTypeSchema = z.enum([
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
] as const);

/**
 * Priority validation schema
 */
const prioritySchema = z.enum(['low', 'normal', 'high', 'urgent'] as const);

/**
 * Status validation schema
 */
const statusSchema = z.enum(['unread', 'read', 'archived'] as const);

/**
 * Title validation schema
 */
const titleSchema = z.string()
  .min(VALIDATION_RULES.TITLE.MIN_LENGTH, 'Title cannot be empty')
  .max(VALIDATION_RULES.TITLE.MAX_LENGTH, `Title cannot exceed ${VALIDATION_RULES.TITLE.MAX_LENGTH} characters`);

/**
 * Message validation schema
 */
const messageSchema = z.string()
  .min(VALIDATION_RULES.MESSAGE.MIN_LENGTH, 'Message cannot be empty')
  .max(VALIDATION_RULES.MESSAGE.MAX_LENGTH, `Message cannot exceed ${VALIDATION_RULES.MESSAGE.MAX_LENGTH} characters`);

/**
 * Create notification data validation schema
 */
const createNotificationSchema = z.object({
  userId: userIdSchema,
  type: notificationTypeSchema,
  title: titleSchema,
  message: messageSchema,
  priority: prioritySchema.optional(),
  relatedFileId: z.string().optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(50).optional(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update notification data validation schema
 */
const updateNotificationSchema = z.object({
  status: statusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Notification filters validation schema
 */
const notificationFiltersSchema = z.object({
  userId: userIdSchema.optional(),
  type: notificationTypeSchema.optional(),
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
  relatedFileId: z.string().optional(),
  includeExpired: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

/**
 * Query options validation schema
 */
const queryOptionsSchema = z.object({
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeRead: z.boolean().optional(),
});

// =============================================================================
// Validation Service
// =============================================================================

export class NotificationValidationService {
  /**
   * Validate user ID format
   */
  public validateUserId(userId: string): void {
    const result = userIdSchema.safeParse(userId);
    if (!result.success) {
      throw createUserIdValidationError(userId);
    }
  }

  /**
   * Validate notification ID format
   */
  public validateNotificationId(notificationId: string): void {
    const result = notificationIdSchema.safeParse(notificationId);
    if (!result.success) {
      throw createNotificationIdValidationError(notificationId);
    }
  }

  /**
   * Validate notification type
   */
  public validateNotificationType(type: string): asserts type is NotificationType {
    const result = notificationTypeSchema.safeParse(type);
    if (!result.success) {
      throw new InvalidNotificationTypeError(type);
    }
  }

  /**
   * Validate notification priority
   */
  public validatePriority(priority: string): asserts priority is NotificationPriority {
    const result = prioritySchema.safeParse(priority);
    if (!result.success) {
      throw new InvalidPriorityError(priority);
    }
  }

  /**
   * Validate title
   */
  public validateTitle(title: string): void {
    const result = titleSchema.safeParse(title);
    if (!result.success) {
      throw createTitleValidationError(title);
    }
  }

  /**
   * Validate message
   */
  public validateMessage(message: string): void {
    const result = messageSchema.safeParse(message);
    if (!result.success) {
      throw createMessageValidationError(message);
    }
  }

  /**
   * Validate create notification data
   */
  public validateCreateData(data: unknown): CreateNotificationData {
    try {
      const result = createNotificationSchema.parse(data);
      
      // Additional business rule validations
      this.validateBusinessRules(result);
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new NotificationValidationError(
          firstError.path.join('.'),
          firstError.message,
          `Validation failed: ${firstError.message}`,
          'VALIDATION_ERROR'
        );
      }
      throw error;
    }
  }

  /**
   * Validate update notification data
   */
  public validateUpdateData(data: unknown): UpdateNotificationData {
    try {
      return updateNotificationSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new NotificationValidationError(
          firstError.path.join('.'),
          firstError.message,
          `Validation failed: ${firstError.message}`,
          'VALIDATION_ERROR'
        );
      }
      throw error;
    }
  }

  /**
   * Validate notification filters
   */
  public validateFilters(filters: unknown): NotificationFilters {
    try {
      return notificationFiltersSchema.parse(filters);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new NotificationValidationError(
          firstError.path.join('.'),
          firstError.message,
          `Filter validation failed: ${firstError.message}`,
          'VALIDATION_ERROR'
        );
      }
      throw error;
    }
  }

  /**
   * Validate query options
   */
  public validateQueryOptions(options: unknown): NotificationQueryOptions {
    try {
      return queryOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new NotificationValidationError(
          firstError.path.join('.'),
          firstError.message,
          `Query options validation failed: ${firstError.message}`,
          'VALIDATION_ERROR'
        );
      }
      throw error;
    }
  }

  /**
   * Validate business rules for notification creation
   */
  private validateBusinessRules(data: CreateNotificationData): void {
    // Validate notification type configuration exists
    if (!NOTIFICATION_TYPE_CONFIG[data.type]) {
      throw new InvalidNotificationTypeError(data.type);
    }

    // Validate action URL and label consistency
    if (data.actionUrl && !data.actionLabel) {
      throw new NotificationValidationError(
        'actionLabel',
        data.actionLabel,
        'Action label is required when action URL is provided',
        'VALIDATION_ERROR'
      );
    }

    // Validate expiration date is in the future
    if (data.expiresAt && data.expiresAt <= new Date()) {
      throw new NotificationValidationError(
        'expiresAt',
        data.expiresAt,
        'Expiration date must be in the future',
        'VALIDATION_ERROR'
      );
    }

    // Validate related file ID format if provided
    if (data.relatedFileId) {
      const fileIdPattern = /^[a-zA-Z0-9]{10}$/; // UploadHaven file ID pattern
      if (!fileIdPattern.test(data.relatedFileId)) {
        throw new NotificationValidationError(
          'relatedFileId',
          data.relatedFileId,
          'Related file ID must be a valid UploadHaven file ID',
          'VALIDATION_ERROR'
        );
      }
    }

    // Validate metadata size (prevent abuse)
    if (data.metadata) {
      const metadataString = JSON.stringify(data.metadata);
      if (metadataString.length > 10000) { // 10KB limit
        throw new NotificationValidationError(
          'metadata',
          data.metadata,
          'Metadata too large (max 10KB)',
          'VALIDATION_ERROR'
        );
      }
    }
  }

  /**
   * Sanitize input data by removing potentially harmful content
   */
  public sanitizeCreateData(data: CreateNotificationData): CreateNotificationData {
    return {
      ...data,
      title: this.sanitizeText(data.title),
      message: this.sanitizeText(data.message),
      actionLabel: data.actionLabel ? this.sanitizeText(data.actionLabel) : undefined,
    };
  }

  /**
   * Sanitize text content
   */
  private sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }

  /**
   * Validate bulk operation data
   */
  public validateBulkIds(ids: unknown): string[] {
    if (!Array.isArray(ids)) {
      throw new NotificationValidationError(
        'ids',
        ids,
        'IDs must be an array',
        'VALIDATION_ERROR'
      );
    }

    if (ids.length === 0) {
      throw new NotificationValidationError(
        'ids',
        ids,
        'At least one ID is required',
        'VALIDATION_ERROR'
      );
    }

    if (ids.length > 100) {
      throw new NotificationValidationError(
        'ids',
        ids,
        'Maximum 100 IDs allowed per bulk operation',
        'VALIDATION_ERROR'
      );
    }

    // Validate each ID
    ids.forEach((id, index) => {
      if (typeof id !== 'string') {
        throw new NotificationValidationError(
          `ids[${index}]`,
          id,
          'ID must be a string',
          'VALIDATION_ERROR'
        );
      }
      
      try {
        this.validateNotificationId(id);
      } catch (error) {
        throw new NotificationValidationError(
          `ids[${index}]`,
          id,
          'Invalid notification ID format',
          'VALIDATION_ERROR'
        );
      }
    });

    return ids as string[];
  }
}

// =============================================================================
// Service Instance
// =============================================================================

export const notificationValidationService = new NotificationValidationService();
