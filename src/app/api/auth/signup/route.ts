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

    // Get the request body
    const body = await request.json();

    // Call the original better-auth signup endpoint
    const authResponse = await auth.api.signUpEmail({
      body,
      headers: await headers(),
    }); // If signup was successful, log the activity and update lastActivity
    if (authResponse && 'user' in authResponse && authResponse.user) {
      try {
        // Update user's lastActivity
        await User.findByIdAndUpdate(authResponse.user.id, {
          lastActivity: new Date(),
        });        await logSecurityEvent(
          'user_registration',
          `User registered: ${authResponse.user.email}`,
          'low',
          true,
          { userId: authResponse.user.id },
          clientIP
        );
      } catch (error) {
        console.error('Failed to log user registration:', error);
      }
    }

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
