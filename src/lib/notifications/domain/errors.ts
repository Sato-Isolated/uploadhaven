/**
 * Notification Domain Errors
 * Custom error classes for the notification domain
 */

import { ERROR_CODES } from './constants';
import type { NotificationId, UserId } from './types';

// =============================================================================
// Base Notification Error
// =============================================================================

/**
 * Base class for all notification-related errors
 */
export abstract class NotificationError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// =============================================================================
// Domain-Specific Errors
// =============================================================================

/**
 * Error thrown when a notification is not found
 */
export class NotificationNotFoundError extends NotificationError {
  constructor(notificationId: NotificationId | string) {
    const id = typeof notificationId === 'string' ? notificationId : notificationId.toString();
    super(`Notification with ID '${id}' not found`, ERROR_CODES.NOTIFICATION_NOT_FOUND);
  }
}

/**
 * Error thrown when user ID is invalid
 */
export class InvalidUserIdError extends NotificationError {
  constructor(userId: string) {
    super(`Invalid user ID: '${userId}'`, ERROR_CODES.INVALID_USER_ID);
  }
}

/**
 * Error thrown when notification ID is invalid
 */
export class InvalidNotificationIdError extends NotificationError {
  constructor(notificationId: string) {
    super(`Invalid notification ID: '${notificationId}'`, ERROR_CODES.INVALID_NOTIFICATION_ID);
  }
}

/**
 * Error thrown when notification type is invalid
 */
export class InvalidNotificationTypeError extends NotificationError {
  constructor(type: string) {
    super(`Invalid notification type: '${type}'`, ERROR_CODES.INVALID_NOTIFICATION_TYPE);
  }
}

/**
 * Error thrown when priority is invalid
 */
export class InvalidPriorityError extends NotificationError {
  constructor(priority: string) {
    super(`Invalid priority: '${priority}'`, ERROR_CODES.INVALID_PRIORITY);
  }
}

/**
 * Error thrown when title is too long
 */
export class TitleTooLongError extends NotificationError {
  constructor(length: number, maxLength: number) {
    super(`Title too long: ${length} characters (max: ${maxLength})`, ERROR_CODES.TITLE_TOO_LONG);
  }
}

/**
 * Error thrown when message is too long
 */
export class MessageTooLongError extends NotificationError {
  constructor(length: number, maxLength: number) {
    super(`Message too long: ${length} characters (max: ${maxLength})`, ERROR_CODES.MESSAGE_TOO_LONG);
  }
}

/**
 * Error thrown when user tries to access notification they don't own
 */
export class UnauthorizedAccessError extends NotificationError {
  constructor(userId: UserId | string, notificationId: NotificationId | string) {
    const uid = typeof userId === 'string' ? userId : userId.toString();
    const nid = typeof notificationId === 'string' ? notificationId : notificationId.toString();
    super(
      `User '${uid}' is not authorized to access notification '${nid}'`,
      ERROR_CODES.UNAUTHORIZED_ACCESS
    );
  }
}

/**
 * Error thrown when trying to access an expired notification
 */
export class NotificationExpiredError extends NotificationError {
  constructor(notificationId: NotificationId | string, expiresAt: Date) {
    const id = typeof notificationId === 'string' ? notificationId : notificationId.toString();
    super(
      `Notification '${id}' expired at ${expiresAt.toISOString()}`,
      ERROR_CODES.NOTIFICATION_EXPIRED
    );
  }
}

/**
 * Error thrown when SSE connection fails
 */
export class SSEConnectionError extends NotificationError {
  constructor(reason: string) {
    super(`SSE connection failed: ${reason}`, ERROR_CODES.SSE_CONNECTION_FAILED);
  }
}

/**
 * Error thrown for database-related issues
 */
export class NotificationDatabaseError extends NotificationError {
  constructor(operation: string, cause?: Error) {
    const message = cause 
      ? `Database operation '${operation}' failed: ${cause.message}`
      : `Database operation '${operation}' failed`;
    super(message, ERROR_CODES.DATABASE_ERROR);
    
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

// =============================================================================
// Validation Errors
// =============================================================================

/**
 * Error thrown for validation failures
 */
export class NotificationValidationError extends NotificationError {
  public readonly field: string;
  public readonly value: unknown;

  constructor(field: string, value: unknown, message: string, code: string) {
    super(`Validation error for field '${field}': ${message}`, code);
    this.field = field;
    this.value = value;
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
    };
  }
}

// =============================================================================
// Error Factory Functions
// =============================================================================

/**
 * Create validation error for title
 */
export function createTitleValidationError(title: string): NotificationValidationError {
  if (title.length === 0) {
    return new NotificationValidationError('title', title, 'Title cannot be empty', ERROR_CODES.TITLE_TOO_LONG);
  }
  
  return new NotificationValidationError(
    'title', 
    title, 
    `Title is too long (${title.length} characters)`, 
    ERROR_CODES.TITLE_TOO_LONG
  );
}

/**
 * Create validation error for message
 */
export function createMessageValidationError(message: string): NotificationValidationError {
  if (message.length === 0) {
    return new NotificationValidationError('message', message, 'Message cannot be empty', ERROR_CODES.MESSAGE_TOO_LONG);
  }
  
  return new NotificationValidationError(
    'message', 
    message, 
    `Message is too long (${message.length} characters)`, 
    ERROR_CODES.MESSAGE_TOO_LONG
  );
}

/**
 * Create validation error for user ID format
 */
export function createUserIdValidationError(userId: string): NotificationValidationError {
  return new NotificationValidationError(
    'userId', 
    userId, 
    'User ID must be a valid MongoDB ObjectId', 
    ERROR_CODES.INVALID_USER_ID
  );
}

/**
 * Create validation error for notification ID format
 */
export function createNotificationIdValidationError(notificationId: string): NotificationValidationError {
  return new NotificationValidationError(
    'notificationId', 
    notificationId, 
    'Notification ID must be a valid MongoDB ObjectId', 
    ERROR_CODES.INVALID_NOTIFICATION_ID
  );
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Check if error is a notification domain error
 */
export function isNotificationError(error: unknown): error is NotificationError {
  return error instanceof NotificationError;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): error is NotificationValidationError {
  return error instanceof NotificationValidationError;
}

/**
 * Convert any error to a notification error
 */
export function toNotificationError(error: unknown, defaultMessage = 'Unknown notification error'): NotificationError {
  if (isNotificationError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new NotificationDatabaseError('unknown', error);
  }
  
  return new NotificationDatabaseError(defaultMessage);
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: NotificationError): string {
  switch (error.code) {
    case ERROR_CODES.NOTIFICATION_NOT_FOUND:
      return 'Notification not found';
    case ERROR_CODES.UNAUTHORIZED_ACCESS:
      return 'You are not authorized to access this notification';
    case ERROR_CODES.NOTIFICATION_EXPIRED:
      return 'This notification has expired';
    case ERROR_CODES.INVALID_NOTIFICATION_TYPE:
      return 'Invalid notification type';
    case ERROR_CODES.TITLE_TOO_LONG:
      return 'Notification title is too long';
    case ERROR_CODES.MESSAGE_TOO_LONG:
      return 'Notification message is too long';
    case ERROR_CODES.SSE_CONNECTION_FAILED:
      return 'Real-time connection failed';
    case ERROR_CODES.DATABASE_ERROR:
      return 'A system error occurred. Please try again.';
    default:
      return 'An unexpected error occurred';
  }
}
