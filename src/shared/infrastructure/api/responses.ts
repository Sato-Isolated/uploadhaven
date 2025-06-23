import { NextResponse } from 'next/server';

/**
 * API Response Utilities - DDD Architecture
 * 
 * Standardized response functions for API endpoints.
 * Privacy-aware: Minimal data exposure, structured error handling.
 * 
 * @architecture DDD - Shared infrastructure utilities
 * @privacy Zero-Knowledge - Safe response formatting
 */

export interface ApiSuccessResponse<T = any> {
  readonly success: true;
  readonly data: T;
  readonly timestamp: string;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code: string;
  readonly timestamp: string;
  readonly details?: any;
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  code: string,
  status: number = 400,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({
    success: false,
    error,
    code,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }, { status });
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  errors: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    'Validation failed',
    'VALIDATION_ERROR',
    422,
    { validationErrors: errors }
  );
}

/**
 * Create not found error response
 */
export function createNotFoundResponse(
  resource: string = 'Resource'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    `${resource} not found`,
    'NOT_FOUND',
    404
  );
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedResponse(): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    'Authentication required',
    'UNAUTHORIZED',
    401
  );
}

/**
 * Create forbidden error response
 */
export function createForbiddenResponse(): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    'Access forbidden',
    'FORBIDDEN',
    403
  );
}

/**
 * Create internal server error response
 */
export function createInternalErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'INTERNAL_ERROR',
    500
  );
}
