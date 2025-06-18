import { NextRequest, NextResponse } from 'next/server';
import { withDatabase, withDatabaseSimple, withDatabaseParams } from './database';
import { 
  withAuth, 
  withAdminAuth, 
  withOptionalAuth, 
  withAuthParams, 
  withAdminAuthParams,
  type AuthenticatedRequest 
} from './auth';
import { withErrorHandler } from './error-handler';

/**
 * Combined middleware for API routes
 * Provides database connection, authentication, and error handling
 */

/**
 * Basic API middleware with database and error handling
 */
export function withAPI<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withErrorHandler(withDatabase(handler));
}

/**
 * Simple API middleware for routes without request parameters
 */
export function withAPISimple(
  handler: () => Promise<NextResponse>
) {
  return withErrorHandler(withDatabaseSimple(handler));
}

/**
 * Authenticated API middleware
 * Requires valid authentication
 */
export function withAuthenticatedAPI<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withErrorHandler(withDatabase(withAuth(handler)));
}

/**
 * Admin API middleware
 * Requires admin authentication
 */
export function withAdminAPI<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withErrorHandler(withDatabase(withAdminAuth(handler)));
}

/**
 * Optional authentication API middleware
 * Authentication is optional but user info is available if logged in
 */
export function withOptionalAuthAPI<T extends any[]>(
  handler: (request: NextRequest & { user?: AuthenticatedRequest['user'] }, ...args: T) => Promise<NextResponse>
) {
  return withErrorHandler(withDatabase(withOptionalAuth(handler)));
}

/**
 * API middleware with dynamic params and authentication
 */
export function withAuthenticatedAPIParams<P extends Record<string, any>>(
  handler: (
    request: AuthenticatedRequest,
    context: { params: Promise<P> }
  ) => Promise<NextResponse>
) {
  return withErrorHandler(withDatabaseParams(withAuthParams(handler)));
}

/**
 * Admin API middleware with dynamic params
 */
export function withAdminAPIParams<P extends Record<string, any>>(
  handler: (
    request: AuthenticatedRequest,
    context: { params: Promise<P> }
  ) => Promise<NextResponse>
) {
  return withErrorHandler(withDatabaseParams(withAdminAuthParams(handler)));
}

/**
 * API middleware with dynamic params (no auth required)
 */
export function withAPIParams<P extends Record<string, any>>(
  handler: (
    request: NextRequest,
    context: { params: Promise<P> }
  ) => Promise<NextResponse>
) {
  return withErrorHandler(withDatabaseParams(handler));
}

// Re-export types and utilities
export type { AuthenticatedRequest } from './auth';
export { 
  createErrorResponse, 
  createSuccessResponse, 
  ERROR_CODES,
  ValidationError,
  DatabaseError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  FileError,
  handleAsyncError,
  type ErrorResponse,
  type SuccessResponse
} from './error-handler';
export { checkDBHealth, disconnectDB } from '../database/mongodb';
