/**
 * Next.js API Route for Server-Sent Events
 * Real-time updates that work natively with Next.js
 */
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log('🔌 SSE client connected');

      // Send initial connection message
      const welcome = {
        type: 'connection',
        data: { message: 'Connected to real-time updates' },
        timestamp: new Date().toISOString(),
      };
      
      controller.enqueue(`data: ${JSON.stringify(welcome)}\n\n`);      // Simulate real-time events for demo
      const sendEvent = (type: string, data: Record<string, unknown>) => {
        const event = {
          type,
          data,
          timestamp: new Date().toISOString(),
        };
        
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch (error) {
          console.error('❌ Failed to send SSE event:', error);
        }
      };

      // Send periodic stats updates (every 30 seconds)
      const statsInterval = setInterval(() => {
        sendEvent('stats_update', {
          totalFiles: Math.floor(Math.random() * 100) + 50,
          totalUsers: Math.floor(Math.random() * 20) + 10,
          storageUsed: Math.floor(Math.random() * 1000) + 500,
        });
      }, 30000);

      // Send activity updates (every 15 seconds)
      const activityInterval = setInterval(() => {
        const activities = [
          'File uploaded',
          'User registered',
          'File downloaded',
          'Security scan completed',
          'File shared',
        ];
        
        sendEvent('activity', {
          action: activities[Math.floor(Math.random() * activities.length)],
          user: `User${Math.floor(Math.random() * 100)}`,
          timestamp: new Date().toISOString(),
        });
      }, 15000);

      // Clean up on close
      request.signal?.addEventListener('abort', () => {
        console.log('🔌 SSE client disconnected');
        clearInterval(statsInterval);
        clearInterval(activityInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    },
  });
}
