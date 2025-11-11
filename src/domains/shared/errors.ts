/**
 * Unified error system for the application
 */

export enum ErrorCode {
    // Generic errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED = 'FILE_TYPE_NOT_ALLOWED',
  FILE_EXPIRED = 'FILE_EXPIRED',
  FILE_MAX_DOWNLOADS_REACHED = 'FILE_MAX_DOWNLOADS_REACHED',
  FILE_NOT_ACCESSIBLE = 'FILE_NOT_ACCESSIBLE',
  
  // Share errors
  SHARE_NOT_FOUND = 'SHARE_NOT_FOUND',
  SHARE_EXPIRED = 'SHARE_EXPIRED',
  SHARE_MAX_ACCESS_REACHED = 'SHARE_MAX_ACCESS_REACHED',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  
  // System errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',
  
  // Operational errors
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  CLEANUP_FAILED = 'CLEANUP_FAILED',
  
  // Feature errors
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  
  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp?: Date;
  correlationId?: string;
}

/**
 * Base error class for the application
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  public readonly statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    correlationId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.statusCode = this.getHttpStatusCode(code);

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getHttpStatusCode(code: ErrorCode): number {
    switch (code) {
      case ErrorCode.NOT_FOUND:
      case ErrorCode.FILE_NOT_FOUND:
      case ErrorCode.SHARE_NOT_FOUND:
        return 404;
      
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.INVALID_PASSWORD:
        return 401;
      
      case ErrorCode.FORBIDDEN:
        return 403;
      
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.FILE_TOO_LARGE:
      case ErrorCode.FILE_TYPE_NOT_ALLOWED:
      case ErrorCode.INVALID_CONFIGURATION:
        return 400;
      
      case ErrorCode.FILE_EXPIRED:
      case ErrorCode.FILE_MAX_DOWNLOADS_REACHED:
      case ErrorCode.FILE_NOT_ACCESSIBLE:
      case ErrorCode.SHARE_EXPIRED:
      case ErrorCode.SHARE_MAX_ACCESS_REACHED:
        return 410; // Gone
      
      case ErrorCode.RATE_LIMITED:
        return 429;
      
      case ErrorCode.FEATURE_DISABLED:
        return 503; // Service Unavailable
      
      default:
        return 500; // Internal Server Error
    }
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId
    };
  }

  static fromError(error: Error, code: ErrorCode = ErrorCode.VALIDATION_ERROR): AppError {
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(code, error.message, error);
  }
}

/**
 * Domain-specific errors
 */
export class FileError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any, correlationId?: string) {
    super(code, message, details, correlationId);
    this.name = 'FileError';
  }
}

export class ShareError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any, correlationId?: string) {
    super(code, message, details, correlationId);
    this.name = 'ShareError';
  }
}

export class StorageError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any, correlationId?: string) {
    super(code, message, details, correlationId);
    this.name = 'StorageError';
  }
}

export class CryptoError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any, correlationId?: string) {
    super(code, message, details, correlationId);
    this.name = 'CryptoError';
  }
}

/**
 * Factory for creating common errors
 */
export class ErrorFactory {
  static fileNotFound(fileId: string): FileError {
    return new FileError(
      ErrorCode.FILE_NOT_FOUND,
      `File with ID ${fileId} not found`
    );
  }

  static fileExpired(fileId: string): FileError {
    return new FileError(
      ErrorCode.FILE_EXPIRED,
      `File with ID ${fileId} has expired`
    );
  }

  static fileMaxDownloadsReached(fileId: string): FileError {
    return new FileError(
      ErrorCode.FILE_MAX_DOWNLOADS_REACHED,
      `File with ID ${fileId} has reached maximum downloads`
    );
  }

  static invalidFileType(mimeType: string): FileError {
    return new FileError(
      ErrorCode.FILE_TYPE_NOT_ALLOWED,
      `File type ${mimeType} is not allowed`
    );
  }

  static fileTooLarge(size: number, maxSize: number): FileError {
    return new FileError(
      ErrorCode.FILE_TOO_LARGE,
      `File size ${size} exceeds maximum allowed size ${maxSize}`
    );
  }

  static shareNotFound(shareId: string): ShareError {
    return new ShareError(
      ErrorCode.SHARE_NOT_FOUND,
      `Share with ID ${shareId} not found`
    );
  }

  static invalidPassword(): ShareError {
    return new ShareError(
      ErrorCode.INVALID_PASSWORD,
      'Invalid password provided'
    );
  }

  static featureDisabled(feature: string): AppError {
    return new AppError(
      ErrorCode.FEATURE_DISABLED,
      `Feature ${feature} is currently disabled`
    );
  }

  static validationError(details: any): AppError {
    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      details
    );
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  /**
   * Check if an error is an AppError
   */
  static isAppError(error: any): error is AppError {
    return error instanceof AppError;
  }

  /**
   * Extract error details for logging
   */
  static extractErrorDetails(error: any): {
    message: string;
    code?: ErrorCode;
    stack?: string;
    details?: any;
  } {
    if (ErrorUtils.isAppError(error)) {
      return {
        message: error.message,
        code: error.code,
        stack: error.stack,
        details: error.details
      };
    }

    return {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      details: error
    };
  }

  /**
   * Generate a unique correlation ID
   */
  static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
