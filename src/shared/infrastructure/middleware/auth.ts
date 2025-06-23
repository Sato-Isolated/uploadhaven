import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { AuthenticationService, AuthSession } from '../../../domains/user-management/application/services/AuthenticationService';

/**
 * Authentication middleware for Next.js API routes (DDD Architecture)
 * Uses domain services for proper session validation
 * 
 * @architecture DDD - Clean separation of concerns
 * @privacy Zero-Knowledge - No tracking, minimal data collection
 */

export interface AuthenticatedRequest extends NextRequest {
  user: AuthSession;
}

/**
 * Middleware to require authentication for API routes
 */
export function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get authentication service from DI container
      // TODO: Use proper DI container when available
      const authService = new AuthenticationService(
        {} as any // Placeholder for now
      );

      // Extract headers
      const requestHeaders = await headers();
      const headerObject: Record<string, string> = {};
      requestHeaders.forEach((value, key) => {
        headerObject[key] = value;
      });

      // Validate session using domain service
      const session = await authService.validateSession({
        headers: headerObject
      });

      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }

      // Add user session to request object with proper type safety
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = session;

      // Call the actual handler
      return await handler(authenticatedRequest, ...args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Authentication middleware failed:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_ERROR'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to require admin privileges
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (request: AuthenticatedRequest, ...args: T) => {
    try {
      // Get authentication service
      const authService = new AuthenticationService(
        {} as any // Placeholder for now
      );

      // Check admin privileges using domain service
      const isAdmin = await authService.isAdmin(request.user.userId);

      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Admin privileges required',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        );
      }

      // Call the actual handler
      return await handler(request, ...args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Admin authentication middleware failed:', errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: 'Admin authentication failed',
          code: 'ADMIN_AUTH_ERROR'
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Middleware for optional authentication (user might or might not be logged in)
 */
export function withOptionalAuth<T extends any[]>(
  handler: (request: NextRequest & { user?: AuthSession }, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get authentication service
      const authService = new AuthenticationService(
        {} as any // Placeholder for now
      );

      // Extract headers
      const requestHeaders = await headers();
      const headerObject: Record<string, string> = {};
      requestHeaders.forEach((value, key) => {
        headerObject[key] = value;
      });

      // Try to validate session (no error if not authenticated)
      const session = await authService.validateSession({
        headers: headerObject
      });

      // Add user session to request object if available
      const requestWithOptionalAuth = request as NextRequest & { user?: AuthSession };
      if (session) {
        requestWithOptionalAuth.user = session;
      }

      // Call the actual handler
      return await handler(requestWithOptionalAuth, ...args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Optional authentication middleware failed:', errorMessage);

      // For optional auth, we continue even if auth fails
      return await handler(request as NextRequest & { user?: AuthSession }, ...args);
    }
  };
}

/**
 * Alias for withAdminAuth for backward compatibility
 * @deprecated Use withAdminAuth instead
 */
export const withAdminAPI = withAdminAuth;
