import { withAuthenticatedAPI, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { NotificationService, NotificationValidationService } from '@/lib/notifications/services';
import { NotificationRepository } from '@/lib/notifications/repository/notification-repository';
import { UserId, NotificationId } from '@/lib/notifications/domain/types';

// Initialize services (in production, this would be done via dependency injection)
const getNotificationService = async () => {
  const repository = new NotificationRepository();
  const validator = new NotificationValidationService();
  return new NotificationService(repository, validator);
};

export const GET = withAuthenticatedAPI(async (request) => {
  try {
    const userId = new UserId(request.user.id);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const includeRead = url.searchParams.get('includeRead') === 'true';

    const service = await getNotificationService();
    
    // Get notifications using the new service layer
    const notifications = await service.getNotifications(userId, {
      limit,
      offset,
      includeRead,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });    // Get statistics
    const stats = await service.getNotificationStats(userId);

    // Return domain types directly (no legacy conversion needed)
    return createSuccessResponse({
      notifications: notifications,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return createErrorResponse('Failed to fetch notifications', 'FETCH_ERROR', 500);
  }
});

export const PATCH = withAuthenticatedAPI(async (request) => {
  try {
    const userId = new UserId(request.user.id);
    const body = await request.json();
    const { notificationIds, markAsRead } = body;

    if (!Array.isArray(notificationIds)) {
      return createErrorResponse('Invalid notification IDs', 'INVALID_IDS', 400);
    }

    const service = await getNotificationService();

    if (markAsRead === true) {
      // Mark notifications as read
      const promises = notificationIds.map(id => 
        service.markAsRead(new NotificationId(id), userId)
      );
      await Promise.all(promises);
    } else {
      // For mark as unread, we would need to extend the service
      // For now, fall back to direct database update
      const { Notification } = await import('@/lib/database/models');
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds }, 
          userId: userId.toString() 
        },
        { $set: { isRead: false } }
      );
    }

    return createSuccessResponse({ updated: notificationIds.length });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return createErrorResponse('Failed to update notifications', 'UPDATE_ERROR', 500);
  }
});