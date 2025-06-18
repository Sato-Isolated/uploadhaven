import { NextRequest, NextResponse } from 'next/server';

/**
 * Standardized error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}

/**
 * Standardized success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Database
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // File Operations
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const;

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  code: string,
  status: number = 500,
  details?: any
): NextResponse {
  const response: ErrorResponse = {
    success: false,
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Centralized error handler middleware
 */
export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Route Error:', {
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      // Handle specific error types
      if (error instanceof ValidationError) {
        return createErrorResponse(
          error.message,
          ERROR_CODES.VALIDATION_ERROR,
          400,
          error.details
        );
      }

      if (error instanceof DatabaseError) {
        return createErrorResponse(
          'Database operation failed',
          ERROR_CODES.DB_QUERY_ERROR,
          500
        );
      }

      if (error instanceof NotFoundError) {
        return createErrorResponse(
          error.message,
          ERROR_CODES.RESOURCE_NOT_FOUND,
          404
        );
      }

      if (error instanceof UnauthorizedError) {
        return createErrorResponse(
          error.message,
          ERROR_CODES.UNAUTHORIZED,
          401
        );
      }

      if (error instanceof ForbiddenError) {
        return createErrorResponse(
          error.message,
          ERROR_CODES.FORBIDDEN,
          403
        );
      }

      // Generic error fallback
      return createErrorResponse(
        'Internal server error',
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    }
  };
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class FileError extends Error {
  constructor(message: string, public fileInfo?: any) {
    super(message);
    this.name = 'FileError';
  }
}

/**
 * Async error handler for use in route handlers
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    if (error instanceof Error) {
      throw error; // Re-throw known errors
    }
    
    throw new Error(`${errorMessage}: ${String(error)}`);
  }
}
