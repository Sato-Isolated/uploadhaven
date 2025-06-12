import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { saveSecurityEvent, User } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    // Get client IP and user agent
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Get the request body
    const body = await request.json();

    // Call the original better-auth signin endpoint
    const authResponse = await auth.api.signInEmail({
      body,
      headers: await headers(),
    }); // If signin was successful, log the activity and update lastActivity
    if (authResponse && 'user' in authResponse && authResponse.user) {
      try {
        // Update user's lastActivity
        await User.findByIdAndUpdate(authResponse.user.id, {
          lastActivity: new Date(),
        });

        await saveSecurityEvent({
          type: 'user_login',
          ip: clientIP,
          details: `User logged in: ${authResponse.user.email}`,
          severity: 'low',
          userAgent,
          userId: authResponse.user.id,
        });
      } catch (error) {
        console.error('Failed to log user login:', error);
      }
    }

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
