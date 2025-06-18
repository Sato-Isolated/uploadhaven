import { NextRequest, NextResponse } from 'next/server';
import connectDB, { checkDBHealth } from '@/lib/database/mongodb';

/**
 * Database middleware for Next.js API routes
 * Ensures database connection is established and healthy before processing requests
 */
export function withDatabase<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check if database is already connected and healthy
      const isHealthy = await checkDBHealth();
      
      if (!isHealthy) {
        // Attempt to reconnect
        await connectDB();
      }

      // Proceed with the original handler
      return await handler(request, ...args);
    } catch (error) {
      console.error('Database middleware error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }
  };
}

/**
 * Simplified database middleware for routes that don't need request parameter
 */
export function withDatabaseSimple(
  handler: () => Promise<NextResponse>
) {
  return async (): Promise<NextResponse> => {
    try {
      // Check if database is already connected and healthy
      const isHealthy = await checkDBHealth();
      
      if (!isHealthy) {
        // Attempt to reconnect
        await connectDB();
      }

      // Proceed with the original handler
      return await handler();
    } catch (error) {
      console.error('Database middleware error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }
  };
}

/**
 * Database middleware for routes with dynamic params
 */
export function withDatabaseParams<P extends Record<string, any>>(
  handler: (
    request: NextRequest,
    context: { params: Promise<P> }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<P> }
  ): Promise<NextResponse> => {
    try {
      // Check if database is already connected and healthy
      const isHealthy = await checkDBHealth();
      
      if (!isHealthy) {
        // Attempt to reconnect
        await connectDB();
      }

      // Proceed with the original handler
      return await handler(request, context);
    } catch (error) {
      console.error('Database middleware error:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }
  };
}
