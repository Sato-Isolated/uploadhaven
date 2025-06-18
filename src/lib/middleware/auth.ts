import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

/**
 * Authentication middleware for Next.js API routes
 * Uses Better Auth for proper session validation
 */

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  };
}

/**
 * Middleware to require authentication for API routes
 */
export function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get session using Better Auth
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }

      // Add user to request object with proper type safety
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        ...session.user,
        role: session.user.role || 'user', // Default to 'user' if role is null/undefined
      };

      // Proceed with the original handler
      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require admin role
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (request: AuthenticatedRequest, ...args: T) => {
    // Check if user is admin by role or by admin email fallback
    const isAdmin = request.user.role === 'admin' || request.user.email === 'admin@uploadhaven.com';
    
    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    return await handler(request, ...args);
  });
}

/**
 * Middleware for optional authentication (user may or may not be logged in)
 */
export function withOptionalAuth<T extends any[]>(
  handler: (request: NextRequest & { user?: AuthenticatedRequest['user'] }, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get session using Better Auth
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      // Add user to request object if authenticated
      const requestWithUser = request as NextRequest & { user?: AuthenticatedRequest['user'] };
      if (session?.user) {
        requestWithUser.user = {
          ...session.user,
          role: session.user.role || 'user', // Default to 'user' if role is null/undefined
        };
      }

      // Proceed with the original handler
      return await handler(requestWithUser, ...args);
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      
      // Continue without authentication if there's an error
      return await handler(request, ...args);
    }
  };
}

/**
 * Authentication middleware for routes with dynamic params
 */
export function withAuthParams<P extends Record<string, any>>(
  handler: (
    request: AuthenticatedRequest,
    context: { params: Promise<P> }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<P> }
  ): Promise<NextResponse> => {
    try {
      // Get session using Better Auth
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }

      // Add user to request object with proper type safety
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        ...session.user,
        role: session.user.role || 'user', // Default to 'user' if role is null/undefined
      };

      // Proceed with the original handler
      return await handler(authenticatedRequest, context);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Admin authentication middleware for routes with dynamic params
 */
export function withAdminAuthParams<P extends Record<string, any>>(
  handler: (
    request: AuthenticatedRequest,
    context: { params: Promise<P> }
  ) => Promise<NextResponse>
) {
  return withAuthParams(async (request: AuthenticatedRequest, context: { params: Promise<P> }) => {
    if (request.user.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    return await handler(request, context);
  });
}
