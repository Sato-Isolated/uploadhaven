import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { Notification } from '@/lib/models';

/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events endpoint for real-time notifications
 * Streams new notifications to authenticated users in real-time
 */
export async function GET() {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Connect to database
    await connectDB();

    // Create SSE response
    const encoder = new TextEncoder();
    let isConnectionClosed = false;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        console.log(`🔔 SSE client connected for user: ${userId}`);

        // Send initial connection message
        const connectMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Notification stream connected',
          timestamp: new Date().toISOString(),
          userId: userId,
        })}\n\n`;

        try {
          controller.enqueue(encoder.encode(connectMessage));
        } catch (error) {
          console.error('❌ Failed to send connection message:', error);
          isConnectionClosed = true;
        }

        // Send existing unread notifications
        sendExistingNotifications(controller, encoder, userId);

        // Set up polling for new notifications with improved error handling
        const pollInterval = setInterval(async () => {
          if (isConnectionClosed) {
            clearInterval(pollInterval);
            return;
          }

          try {
            await checkForNewNotifications(controller, encoder, userId);
          } catch (error) {
            console.error('❌ Error polling notifications:', error);
            // Don't close stream on polling errors, just continue
          }
        }, 5000); // Poll every 5 seconds

        // Cleanup function with better error handling
        const cleanup = () => {
          console.log(`🔌 SSE client disconnected for user: ${userId}`);
          isConnectionClosed = true;
          clearInterval(pollInterval);
        };

        // Store cleanup function for later use
        (
          controller as ReadableStreamDefaultController & {
            _cleanup?: () => void;
          }
        )._cleanup = cleanup;
      },
      cancel() {
        console.log(`🔌 SSE stream cancelled for user: ${userId}`);
        isConnectionClosed = true;
        // Cleanup when stream is closed/cancelled
        const ctrl = this as ReadableStreamDefaultController & {
          _cleanup?: () => void;
        };
        if (ctrl._cleanup) {
          ctrl._cleanup();
        }
      },
    });

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE notifications error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Send existing unread notifications to newly connected client
 */
async function sendExistingNotifications(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  userId: string
) {
  try {
    const unreadNotifications = await Notification.find({
      userId,
      isRead: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10) // Limit to recent 10 unread notifications
      .lean();

    for (const notification of unreadNotifications) {
      const message = `data: ${JSON.stringify({
        type: 'notification',
        data: {
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
        },
      })}\n\n`;

      controller.enqueue(encoder.encode(message));
    }
  } catch (error) {
    console.error('Error sending existing notifications:', error);
  }
}

/**
 * Check for new notifications and send them via SSE
 */
let lastCheckTime = new Date();

async function checkForNewNotifications(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  userId: string
) {
  try {
    // Check if controller is still open
    if (!controller || controller.desiredSize === null) {
      console.log('⚠️ SSE controller is closed, skipping notification check');
      return;
    }

    const currentTime = new Date();

    // Find notifications created since last check
    const newNotifications = await Notification.find({
      userId,
      createdAt: { $gt: lastCheckTime },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: currentTime } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean(); // Send each new notification
    for (const notification of newNotifications) {
      // Check if controller is still open before sending
      if (!controller || controller.desiredSize === null) {
        console.log('⚠️ SSE controller closed during notification sending');
        return;
      }

      const message = `data: ${JSON.stringify({
        type: 'notification',
        data: {
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
        },
      })}\n\n`;

      try {
        controller.enqueue(encoder.encode(message));
        console.log(
          `🔔 Sent new notification to user ${userId}: ${notification.title}`
        );
      } catch (error) {
        console.error('❌ Failed to send notification via SSE:', error);
        return; // Stop trying to send more notifications if there's an error
      }
    }

    // Update last check time
    lastCheckTime = currentTime;
  } catch (error) {
    console.error('Error checking for new notifications:', error);
    throw error;
  }
}
