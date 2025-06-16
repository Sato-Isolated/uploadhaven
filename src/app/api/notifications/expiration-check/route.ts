import { NextRequest, NextResponse } from 'next/server';
import { createFileExpirationNotifications } from '@/lib/notifications/security-notifications';
import connectDB from '@/lib/database/mongodb';

/**
 * Background job endpoint for creating file expiration notifications
 * This should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (could use API key or internal header)
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY;

    if (!internalKey || authHeader !== `Bearer ${internalKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Create expiration notifications
    await createFileExpirationNotifications();

    return NextResponse.json({
      success: true,
      message: 'File expiration notifications created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to create file expiration notifications:', error);
    return NextResponse.json(
      {
        error: 'Failed to create notifications',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      error:
        'Method not allowed. Use POST to trigger expiration notifications.',
    },
    { status: 405 }
  );
}
