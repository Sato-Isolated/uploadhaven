import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { RealTimeDeliveryService } from '@/lib/notifications/services/delivery/real-time-delivery';
import { NotificationService, NotificationValidationService } from '@/lib/notifications/services';
import { NotificationRepository } from '@/lib/notifications/repository/notification-repository';
import { UserId } from '@/lib/notifications/domain/types';

// Global delivery service instance for SSE management
let deliveryService: RealTimeDeliveryService | null = null;

const getDeliveryService = () => {
  if (!deliveryService) {
    deliveryService = new RealTimeDeliveryService();
  }
  return deliveryService;
};

const getNotificationService = () => {
  const repository = new NotificationRepository();
  const validator = new NotificationValidationService();
  return new NotificationService(repository, validator);
};

/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events endpoint for real-time notifications
 * Uses the new notification service architecture for improved reliability
 */
export async function GET() {
  try {
    // Authenticate user using BetterAuth
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = new UserId(session.user.id);
    const delivery = getDeliveryService();

    console.log(`🔔 SSE client connecting for user: ${userId.toString()}`);

    // Create SSE response with manual stream handling
    const encoder = new TextEncoder();
    let isConnectionClosed = false;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        console.log(`🔔 SSE client connected for user: ${userId.toString()}`);

        // Send initial connection message
        const connectMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Notification stream connected',
          timestamp: new Date().toISOString(),
          userId: userId.toString(),
        })}\n\n`;

        try {
          controller.enqueue(encoder.encode(connectMessage));
        } catch (error) {
          console.error('❌ Failed to send connection message:', error);
          isConnectionClosed = true;
          return;
        }

        // Send existing notifications
        sendExistingNotifications(controller, encoder, userId.toString());

        // Subscribe to real-time notifications using the delivery service
        const unsubscribe = delivery.subscribe(userId, (event) => {
          if (isConnectionClosed) return;          try {
            const message = `data: ${JSON.stringify({
              type: event.type,
              data: event.data, // Send domain types directly
              timestamp: event.timestamp.toISOString(),
            })}\n\n`;

            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error('❌ Failed to send notification:', error);
            isConnectionClosed = true;
          }
        });

        // Set up heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (isConnectionClosed) {
            clearInterval(heartbeatInterval);
            return;
          }

          try {
            const heartbeat = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            })}\n\n`;

            controller.enqueue(encoder.encode(heartbeat));
          } catch (error) {
            console.error('❌ Failed to send heartbeat:', error);
            isConnectionClosed = true;
            clearInterval(heartbeatInterval);
          }
        }, 30000); // Heartbeat every 30 seconds

        // Cleanup function
        const cleanup = () => {
          console.log(`🔌 SSE client disconnected for user: ${userId.toString()}`);
          isConnectionClosed = true;
          clearInterval(heartbeatInterval);
          unsubscribe();
        };

        // Store cleanup function for cancel
        (controller as any)._cleanup = cleanup;
      },

      cancel() {
        console.log(`🔌 SSE stream cancelled for user: ${userId.toString()}`);
        isConnectionClosed = true;
        
        // Call cleanup if available
        const ctrl = this as any;
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
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ SSE endpoint error:', error);
    return new Response('Internal Server Error', { status: 500 });
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
    const notificationService = getNotificationService();
    const userIdObj = new UserId(userId);
    
    // Get recent unread notifications using the service layer
    const notifications = await notificationService.getNotifications(userIdObj, {
      limit: 10,
      includeRead: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });    // Send initial data message
    const initialMessage = `data: ${JSON.stringify({
      type: 'initial_notifications',
      data: notifications, // Send domain types directly
      count: notifications.length,
      timestamp: new Date().toISOString(),
    })}\n\n`;

    controller.enqueue(encoder.encode(initialMessage));

    console.log(`📨 Sent ${notifications.length} existing notifications to user: ${userId}`);
  } catch (error) {
    console.error('❌ Error sending existing notifications:', error);
    
    // Send error message to client
    const errorMessage = `data: ${JSON.stringify({
      type: 'error',
      message: 'Failed to load existing notifications',
      timestamp: new Date().toISOString(),
    })}\n\n`;

    try {
      controller.enqueue(encoder.encode(errorMessage));
    } catch (encodeError) {
      console.error('❌ Failed to send error message:', encodeError);
    }
  }
}
