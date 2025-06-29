import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { User } from '@/lib/database/models';
import { logSecurityEvent } from '@/lib/audit/audit-service';

export async function POST(request: NextRequest) {
  try {
    // Get client IP and user agent
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Get current session to log the user before signing out
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Call the original better-auth signout endpoint
    const authResponse = await auth.api.signOut({
      headers: await headers(),
    }); // If we had a session, log the logout activity and update lastActivity
    if (session?.user) {
      try {
        // Update user's lastActivity
        await User.findByIdAndUpdate(session.user.id, {
          lastActivity: new Date(),
        });        await logSecurityEvent(
          'user_logout',
          `User logged out: ${session.user.email}`,
          'low',
          true,
          { userId: session.user.id },
          clientIP
        );
      } catch (error) {
        console.error('Failed to log user logout:', error);
      }
    }

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
