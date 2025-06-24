import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/shared/infrastructure/di/dependency-container';

/**
 * POST /api/auth/signup
 *
 * User registration endpoint (DDD Architecture).
 * Handles user signup with privacy-compliant logging and activity tracking.
 * 
 * @architecture DDD - Uses user-management domain services
 * @privacy Privacy-aware - Minimal logging, encrypted user data
 */
export async function POST(request: NextRequest) {
  try {
    // Get client metadata for privacy and security
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Get request body
    const body = await request.json();

    console.log('🔐 User signup attempt:', {
      email: body.email ? '***@' + body.email.split('@')[1] : 'unknown',
      hasPassword: !!body.password,
      clientIP: clientIP.split('.')[0] + '.***'
    });

    // Use Domain Service through Service Layer for registration
    const registrationResult = await UserService.registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
      clientIP,
      userAgent,
    });

    console.log('✅ User registration successful:', {
      userId: registrationResult.user?.id?.slice(-8),
      email: registrationResult.user?.email ? '***@' + registrationResult.user.email.split('@')[1] : 'unknown'
    });

    return NextResponse.json(registrationResult);

  } catch (error) {
    console.error('❌ Signup failed:', error);

    // Log security event through Domain Service
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await UserService.logAuthenticationEvent({
      type: 'registration_failed',
      message: `User registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'medium',
      clientIP,
      userAgent,
    });

    return NextResponse.json({
      error: 'Registration failed',
      message: 'Unable to create account at this time'
    }, { status: 500 });
  }
}
