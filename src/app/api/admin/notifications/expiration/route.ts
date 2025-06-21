import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { expirationNotificationService } from '@/lib/background/expiration-notifications';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware';

/**
 * GET /api/admin/notifications/expiration
 * 
 * Get statistics about files expiring soon
 */
export async function GET() {
  try {
    // Check admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.role || session.user.role !== 'admin') {
      return createErrorResponse('Admin access required', 'UNAUTHORIZED', 403);
    }

    const stats = await expirationNotificationService.getExpiringFilesStats();
    
    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error getting expiration stats:', error);
    return createErrorResponse('Failed to get expiration statistics', 'SERVER_ERROR', 500);
  }
}

/**
 * POST /api/admin/notifications/expiration
 * 
 * Manually trigger expiration notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.role || session.user.role !== 'admin') {
      return createErrorResponse('Admin access required', 'UNAUTHORIZED', 403);
    }

    const body = await request.json().catch(() => ({}));
    const {
      notifyWithinHours = 24,
      minHoursUntilExpiry = 1,
      maxNotifications = 50
    } = body;

    console.log(`📧 Manual expiration notification triggered by admin: ${session.user.email}`);

    const result = await expirationNotificationService.notifyExpiringFiles({
      notifyWithinHours,
      minHoursUntilExpiry,
      maxNotifications,
    });

    return createSuccessResponse({
      action: 'expiration_notifications_sent',
      result,
      triggeredBy: session.user.email,
    });

  } catch (error) {
    console.error('Error sending expiration notifications:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to send notifications',
      'SERVER_ERROR',
      500
    );
  }
}
