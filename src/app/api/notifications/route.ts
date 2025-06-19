import { withAuthenticatedAPI, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { Notification } from '@/lib/database/models';

export const GET = withAuthenticatedAPI(async (request) => {
  try {
    const userId = request.user.id;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get notifications for the user
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return createSuccessResponse({
      notifications,
      total: await Notification.countDocuments({ userId }),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return createErrorResponse('Failed to fetch notifications', 'FETCH_ERROR', 500);
  }
});

export const PATCH = withAuthenticatedAPI(async (request) => {
  try {
    const userId = request.user.id;
    const body = await request.json();
    const { notificationIds, markAsRead } = body;

    if (!Array.isArray(notificationIds)) {
      return createErrorResponse('Invalid notification IDs', 'INVALID_IDS', 400);
    }

    // Update notifications
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds }, 
        userId 
      },
      { $set: { isRead: markAsRead === true } }
    );

    return createSuccessResponse({ updated: notificationIds.length });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return createErrorResponse('Failed to update notifications', 'UPDATE_ERROR', 500);
  }
});