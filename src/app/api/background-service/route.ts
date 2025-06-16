import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import {
  getBackgroundServicesStatus,
  triggerManualCleanup,
  triggerInstantExpiration,
} from '@/lib/background/startup';

export async function GET() {
  try {
    // Get the status of background services
    const status = getBackgroundServicesStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error getting background service status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get service status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication for admin operations
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'manual_cleanup':
        console.log('Manual cleanup triggered by user:', session.user.email);
        const cleanupResult = await triggerManualCleanup();
        return NextResponse.json({
          success: true,
          action: 'manual_cleanup',
          result: cleanupResult,
        });

      case 'instant_expiration_check':
        console.log(
          'Instant expiration check triggered by user:',
          session.user.email
        );
        const expirationResult = await triggerInstantExpiration();
        return NextResponse.json({
          success: true,
          action: 'instant_expiration_check',
          result: expirationResult,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Background service API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
