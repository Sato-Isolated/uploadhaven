import { NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  try {
    // Check database connection
    await connectDB();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'disconnected',
        api: 'operational'
      }
    }, { status: 503 });
  }
}

/**
 * HEAD /api/health
 * Health check endpoint for monitoring (HEAD request)
 */
export async function HEAD() {
  try {
    await connectDB();
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
