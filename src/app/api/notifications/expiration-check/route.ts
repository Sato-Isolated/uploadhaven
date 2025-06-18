import { NextRequest } from 'next/server';
import { withAPI, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { createFileExpirationNotifications } from '@/lib/notifications/security-notifications';

/**
 * Background job endpoint for creating file expiration notifications
 * This should be called by a cron job or scheduled task
 */
export const POST = withAPI(async (request: NextRequest) => {
  try {
    // Verify this is an internal request (could use API key or internal header)
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY;

    if (!internalKey || authHeader !== `Bearer ${internalKey}`) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Database connection handled by withAPI middleware

    // Create expiration notifications
    await createFileExpirationNotifications();

    return createSuccessResponse({
      message: 'File expiration notifications created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to create file expiration notifications:', error);
    return createErrorResponse(
      'Failed to create notifications',
      'NOTIFICATION_CREATION_FAILED',
      500
    );
  }
});

// Handle unsupported methods
export async function GET() {
  return createErrorResponse(
    'Method not allowed. Use POST to trigger expiration notifications.',
    'METHOD_NOT_ALLOWED',
    405
  );
}
