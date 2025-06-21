import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuthAPI, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { saveNotification } from '@/lib/database/models';

/**
 * POST /api/notifications/test
 * Create a test notification for the current user (for debugging)
 */
export const POST = withOptionalAuthAPI(async (request: NextRequest, { user }) => {
  try {
    if (!user?.id) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Create a test notification
    const testNotification = await saveNotification({
      userId: user.id,
      type: 'system_announcement',
      title: 'Test Notification',
      message: 'This is a test notification to verify the notification system is working correctly.',
      priority: 'normal',
      metadata: {
        isTest: true,
        createdBy: 'debug-endpoint',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('📝 Created test notification:', testNotification._id);

    return createSuccessResponse({
      message: 'Test notification created successfully',
      notification: {
        id: testNotification._id.toString(),
        title: testNotification.title,
        message: testNotification.message,
        type: testNotification.type,
        priority: testNotification.priority,
        createdAt: testNotification.createdAt,
        isRead: testNotification.isRead,
      },
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return createErrorResponse('Failed to create test notification', 'INTERNAL_ERROR', 500);
  }
});
