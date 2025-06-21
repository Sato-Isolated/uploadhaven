/**
 * Real-time Delivery Service
 * Responsible ONLY for real-time notification broadcasting - follows SRP
 * 
 * Single Responsibility: Handle Server-Sent Events (SSE) for real-time notifications
 */

import type { 
  NotificationEntity,
  INotificationBroadcaster,
  NotificationEvent,
} from '../../domain/types';
import { UserId } from '../../domain/types';

// =============================================================================
// SSE Connection Manager
// =============================================================================

interface SSEConnection {
  readonly userId: string;
  readonly response: Response;
  readonly controller: ReadableStreamDefaultController;
  readonly connectedAt: Date;
  readonly lastPing: Date;
}

export class RealTimeDeliveryService implements INotificationBroadcaster {
  private readonly connections = new Map<string, SSEConnection>();
  private readonly pingInterval = 30000; // 30 seconds
  private readonly cleanupInterval = 60000; // 1 minute
  private pingTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startPingTimer();
    this.startCleanupTimer();
  }

  // =============================================================================
  // Connection Management
  // =============================================================================

  /**
   * Create SSE connection for a user
   */
  public createConnection(userId: string): Response {
    const stream = new ReadableStream({
      start: (controller) => {
        const connection: SSEConnection = {
          userId,
          response: new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Cache-Control',
            },
          }),
          controller,
          connectedAt: new Date(),
          lastPing: new Date(),
        };

        this.connections.set(userId, connection);

        // Send initial connection message
        this.sendToConnection(connection, {
          type: 'connected',
          message: 'Real-time notifications connected',
          timestamp: new Date().toISOString(),
        });

        console.log(`🔔 SSE connection established for user: ${userId}`);
      },
      cancel: () => {
        this.connections.delete(userId);
        console.log(`🔔 SSE connection closed for user: ${userId}`);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  }

  /**
   * Close connection for a user
   */
  public closeConnection(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      try {
        connection.controller.close();
      } catch (error) {
        console.warn(`Error closing SSE connection for user ${userId}:`, error);
      }
      this.connections.delete(userId);
    }
  }

  // =============================================================================
  // Broadcasting
  // =============================================================================

  /**
   * Broadcast notification to specific user
   */
  public async broadcast(userId: UserId, event: NotificationEvent): Promise<void> {
    const connection = this.connections.get(userId.toString());
    if (!connection) {
      return; // User not connected
    }

    try {
      this.sendToConnection(connection, {
        type: 'notification',
        data: event.data,
        timestamp: event.timestamp.toISOString(),
      });
    } catch (error) {
      console.error(`Failed to broadcast to user ${userId}:`, error);
      this.closeConnection(userId.toString());
    }
  }

  /**
   * Broadcast to all connected users
   */  public async broadcastToAll(event: NotificationEvent): Promise<void> {
    const promises = Array.from(this.connections.keys()).map(userId => 
      this.broadcast(new UserId(userId), event)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Broadcast to multiple users
   */
  public async broadcastToUsers(userIds: UserId[], event: NotificationEvent): Promise<void> {
    const promises = userIds.map(userId => this.broadcast(userId, event));
    await Promise.allSettled(promises);
  }

  // =============================================================================
  // Subscription Management (for hooks)
  // =============================================================================

  public subscribe(userId: UserId, callback: (event: NotificationEvent) => void): () => void {
    // This method is primarily for the hook interface
    // Real subscription happens through SSE connection
    const userIdStr = userId.toString();
    
    // We could store callbacks for internal use if needed
    return () => {
      // Cleanup callback
    };
  }

  public unsubscribe(userId: UserId): void {
    this.closeConnection(userId.toString());
  }

  // =============================================================================
  // Internal Methods
  // =============================================================================

  private sendToConnection(connection: SSEConnection, data: any): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    
    try {
      connection.controller.enqueue(encoder.encode(message));
    } catch (error) {
      console.error('Failed to send SSE message:', error);
      this.closeConnection(connection.userId);
    }
  }

  private startPingTimer(): void {
    this.pingTimer = setInterval(() => {
      this.sendPingToAll();
    }, this.pingInterval);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleConnections();
    }, this.cleanupInterval);
  }

  private sendPingToAll(): void {
    const now = new Date();
    
    for (const [userId, connection] of this.connections) {
      try {
        this.sendToConnection(connection, {
          type: 'ping',
          timestamp: now.toISOString(),
        });
        
        // Update last ping
        (connection as any).lastPing = now;
      } catch (error) {
        console.warn(`Failed to ping user ${userId}:`, error);
        this.closeConnection(userId);
      }
    }
  }

  private cleanupStaleConnections(): void {
    const staleThreshold = Date.now() - (this.pingInterval * 3); // 3 missed pings
    
    for (const [userId, connection] of this.connections) {
      if (connection.lastPing.getTime() < staleThreshold) {
        console.log(`Cleaning up stale connection for user: ${userId}`);
        this.closeConnection(userId);
      }
    }
  }

  // =============================================================================
  // Statistics and Management
  // =============================================================================

  public getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([userId, conn]) => ({
        userId,
        connectedAt: conn.connectedAt,
        lastPing: conn.lastPing,
      })),
    };
  }

  public isUserConnected(userId: string): boolean {
    return this.connections.has(userId);
  }

  public getConnectedUserIds(): string[] {
    return Array.from(this.connections.keys());
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  public destroy(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Close all connections
    for (const userId of this.connections.keys()) {
      this.closeConnection(userId);
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let instance: RealTimeDeliveryService | null = null;

export function getRealTimeDeliveryService(): RealTimeDeliveryService {
  if (!instance) {
    instance = new RealTimeDeliveryService();
  }
  return instance;
}
