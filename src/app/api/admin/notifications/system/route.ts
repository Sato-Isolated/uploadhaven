import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { User, saveNotification } from '@/lib/models';

/**
 * Admin endpoint for creating system-wide notifications
 * Only admins can create system announcements
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { title, message, priority = 'normal', targetUsers = 'all', metadata } = await request.json();

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be low, normal, high, or urgent.' },
        { status: 400 }
      );
    }

    // Get target users
    let userIds: string[] = [];
    
    if (targetUsers === 'all') {
      // Get all user IDs
      const users = await User.find({}, '_id').lean();
      userIds = users.map(user => user._id.toString());
    } else if (Array.isArray(targetUsers)) {
      // Specific user IDs provided
      userIds = targetUsers;
    } else {
      return NextResponse.json(
        { error: 'Invalid targetUsers. Must be "all" or array of user IDs.' },
        { status: 400 }
      );
    }

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users found to send notification to' },
        { status: 400 }
      );
    }

    // Create notifications for all target users
    const notificationPromises = userIds.map(userId =>
      saveNotification({
        userId,
        type: 'system_announcement',
        title,
        message,
        priority,
        metadata: {
          createdBy: session.user.id,
          createdByEmail: session.user.email,
          isSystemAnnouncement: true,
          ...metadata,
        },
      }).catch(error => {
        console.error(`Failed to create notification for user ${userId}:`, error);
        return null; // Continue with other users
      })
    );

    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value !== null).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
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
        targetUsers: targetUsers === 'all' ? 'all users' : `${userIds.length} specific users`,
      },
    });
  } catch (error) {
    console.error('Failed to create system notification:', error);
    return NextResponse.json(
      { error: 'Failed to create system notification' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create system notifications.' },
    { status: 405 }
  );
}
