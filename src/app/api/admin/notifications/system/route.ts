import { NextRequest } from 'next/server';
import { withAdminAPI, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { User, saveNotification } from '@/lib/database/models';

/**
 * Admin endpoint for creating system-wide notifications
 * Only admins can create system announcements
 */
export const POST = withAdminAPI(async (request: AuthenticatedRequest) => {
  try {
    const {
      title,
      message,
      priority = 'normal',
      targetUsers = 'all',
      metadata,
    } = await request.json();

    // Validate required fields
    if (!title || !message) {
      return createErrorResponse('Title and message are required', 'INVALID_INPUT', 400);
    }

    // Validate priority
    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return createErrorResponse('Invalid priority. Must be low, normal, high, or urgent.', 'INVALID_INPUT', 400);
    }

    // Get target users
    let userIds: string[] = [];

    if (targetUsers === 'all') {
      // Get all user IDs
      const users = await User.find({}, '_id').lean();
      userIds = users.map((user) => user._id.toString());
    } else if (Array.isArray(targetUsers)) {
      // Specific user IDs provided
      userIds = targetUsers;
    } else {
      return createErrorResponse('Invalid targetUsers. Must be "all" or array of user IDs.', 'INVALID_INPUT', 400);
    }

    if (userIds.length === 0) {
      return createErrorResponse('No users found to send notification to', 'NO_TARGET_USERS', 400);
    }

    // Create notifications for all target users
    const notificationPromises = userIds.map((userId) =>
      saveNotification({
        userId,
        type: 'system_announcement',
        title,
        message,
        priority,
        metadata: {
          createdBy: request.user.id,
          createdByEmail: request.user.email,
          isSystemAnnouncement: true,
          ...metadata,
        },
      }).catch((error) => {
        console.error(
          `Failed to create notification for user ${userId}:`,
          error
        );
        return null; // Continue with other users
      })
    );

    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(
      (result) => result.status === 'fulfilled' && result.value !== null
    ).length;
    const failureCount = results.length - successCount;

    return createSuccessResponse({
      message: `System notification created successfully`,
      stats: {
        totalUsers: userIds.length,
        successful: successCount,
        failed: failureCount,
      },
      notification: {
        title,
        message,
        priority,
        targetUsers:
          targetUsers === 'all'
            ? 'all users'
            : `${userIds.length} specific users`,
      },
    });
  } catch (error) {
    console.error('Failed to create system notification:', error);
    return createErrorResponse(
      'Failed to create system notification',
      'SYSTEM_NOTIFICATION_FAILED',
      500
    );
  }
});

// Handle unsupported methods
export async function GET() {
  return createErrorResponse(
    'Method not allowed. Use POST to create system notifications.',
    'METHOD_NOT_ALLOWED',
    405
  );
}
