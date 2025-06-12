import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
} from '@/lib/models';

/**
 * GET /api/notifications
 *
 * Get notifications for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    await connectDB();

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const includeRead = url.searchParams.get('includeRead') !== 'false';
    const type = url.searchParams.get('type') || undefined;
    const statsOnly = url.searchParams.get('stats') === 'true';

    if (statsOnly) {
      // Return only statistics
      const stats = await getNotificationStats(userId);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Get notifications with options
    const notifications = await getNotificationsForUser(userId, {
      limit,
      includeRead,
      type,
    });

    // Transform notifications for client
    const transformedNotifications = notifications.map((notification) => ({
      id: notification._id.toString(),
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      priority: notification.priority,
      relatedFileId: notification.relatedFileId,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
      createdAt: notification.createdAt,
      metadata: notification.metadata,
    }));

    return NextResponse.json({
      success: true,
      notifications: transformedNotifications,
      count: transformedNotifications.length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 *
 * Update notification(s) - mark as read/unread
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    await connectDB();

    const body = await request.json();
    const { notificationId, action } = body;

    if (action === 'markAllRead') {
      // Mark all notifications as read
      const result = await markAllNotificationsAsRead(userId);
      return NextResponse.json({
        success: true,
        message: `Marked ${result.modifiedCount} notifications as read`,
      });
    }

    if (action === 'markRead' && notificationId) {
      // Mark specific notification as read
      const notification = await markNotificationAsRead(notificationId, userId);
      if (!notification) {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        notification: {
          id: notification._id.toString(),
          isRead: notification.isRead,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 *
 * Delete specific notification
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    await connectDB();

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID required' },
        { status: 400 }
      );
    }

    const deletedNotification = await deleteNotification(
      notificationId,
      userId
    );

    if (!deletedNotification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
