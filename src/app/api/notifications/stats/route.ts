import { NextRequest } from 'next/server';
import { withOptionalAuthAPI, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { Notification } from '@/lib/database/models';

/**
 * GET /api/notifications/stats
 * Get notification statistics for the current user
 */
export const GET = withOptionalAuthAPI(async (request: NextRequest, { user }) => {
  try {
    // If no user is authenticated, return empty stats
    if (!user?.id) {
      return createSuccessResponse({
        total: 0,
        unread: 0,
        read: 0,
        byType: {},
        byPriority: {},
      });
    }

    // Get total count of notifications
    const totalCount = await Notification.countDocuments({
      userId: user.id,
    });

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: user.id,
      isRead: false,
    });

    // Get counts by type
    const typeCounts = await Notification.aggregate([
      { $match: { userId: user.id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    // Get counts by priority    // Get status counts (for GDPR compliance, only return read/unread)
    const statusCounts = await Notification.aggregate([
      { $match: { userId: user.id } },
      { 
        $group: { 
          _id: { $cond: [{ $eq: ['$status', 'read'] }, 'read', 'unread'] }, 
          count: { $sum: 1 } 
        } 
      },
    ]);

    const priorityCounts = await Notification.aggregate([
      { $match: { userId: user.id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Convert aggregation results to objects with default values
    const typeStats = typeCounts.reduce((acc: Record<string, number>, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const priorityStats = priorityCounts.reduce((acc: Record<string, number>, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const statusStats = statusCounts.reduce((acc: Record<string, number>, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Ensure all required fields are present with defaults
    const stats = {
      total: totalCount,
      unread: unreadCount,
      byType: {
        file_downloaded: typeStats.file_downloaded || 0,
        file_expired_soon: typeStats.file_expired_soon || 0,
        file_shared: typeStats.file_shared || 0,
        security_alert: typeStats.security_alert || 0,
        malware_detected: typeStats.malware_detected || 0,
        system_announcement: typeStats.system_announcement || 0,
        file_upload_complete: typeStats.file_upload_complete || 0,
        bulk_action_complete: typeStats.bulk_action_complete || 0,
        account_security: typeStats.account_security || 0,
        admin_alert: typeStats.admin_alert || 0,
      },
      byPriority: {
        low: priorityStats.low || 0,
        normal: priorityStats.normal || 0,
        high: priorityStats.high || 0,
        urgent: priorityStats.urgent || 0,
      },
      byStatus: {
        unread: statusStats.unread || 0,
        read: statusStats.read || 0,
        archived: statusStats.archived || 0,
      },
    };

    return createSuccessResponse(stats);

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return createErrorResponse('Failed to fetch notification stats', 'INTERNAL_ERROR', 500);
  }
});
