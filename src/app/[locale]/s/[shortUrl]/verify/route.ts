import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { File } from '@/lib/database/models';
import { verifyPassword } from '@/lib/core/utils';
import { rateLimit, rateLimitConfigs } from '@/lib/core/rateLimit';
import { logSecurityEvent } from '@/lib/audit/audit-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; shortUrl: string }> }
) {
  try {
    await connectDB();

    const { shortUrl } = await params;

    // Get client IP and user agent for logging
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || ''; // Apply rate limiting for password attempts
    const rateLimitCheck = rateLimit(rateLimitConfigs.password)(request);    if (!rateLimitCheck.success) {
      await logSecurityEvent(
        'rate_limit_exceeded',
        `Password verification rate limit exceeded for ${shortUrl}`,
        'medium',
        true,
        { ip: clientIP, userAgent, shortUrl },
        clientIP
      );

      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.message,
          rateLimit: {
            limit: rateLimitCheck.limit,
            remaining: rateLimitCheck.remaining,
            reset: rateLimitCheck.reset,
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.reset.toISOString(),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Find file by short URL
    const fileDoc = await File.findOne({
      shortUrl,
      isDeleted: false,
    });    if (!fileDoc) {
      // Log suspicious activity - trying to access non-existent file
      await logSecurityEvent(
        'suspicious_activity',
        `Password verification attempt for non-existent file: ${shortUrl}`,
        'medium',
        false,
        { ip: clientIP, userAgent, shortUrl },
        clientIP
      );

      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'File has expired' },
        { status: 410 }
      );
    }

    // Check if file is password protected
    if (!fileDoc.isPasswordProtected || !fileDoc.password) {
      return NextResponse.json(
        { success: false, error: 'File is not password protected' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, fileDoc.password);    if (!isPasswordValid) {
      // Log failed password attempt
      await logSecurityEvent(
        'failed_authentication',
        `Failed password attempt for file: ${fileDoc.originalName}`,
        'medium',
        false,
        { ip: clientIP, userAgent, filename: fileDoc.filename, originalName: fileDoc.originalName },
        clientIP
      );

      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Password is correct - generate a temporary access token or session
    // For simplicity, we'll return success and let the frontend redirect
    // In a production app, you might want to use JWT tokens or sessions    // Log successful password verification
    await logSecurityEvent(
      'successful_authentication',
      `Password verified for file: ${fileDoc.originalName}`,
      'info',
      false,
      { ip: clientIP, userAgent, filename: fileDoc.filename, originalName: fileDoc.originalName },
      clientIP
    );

    return NextResponse.json({
      success: true,
      message: 'Password verified',
      fileInfo: {
        filename: fileDoc.originalName,
        size: fileDoc.size,
        type: fileDoc.mimeType,
        uploadDate: fileDoc.uploadDate,
      },
    });
  } catch (error) {
    console.error('Password verification error:', error);    // Try to log the error
    try {
      const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await logSecurityEvent(
        'system_error',
        `Password verification error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        'high',
        false,
        { ip: clientIP, userAgent: request.headers.get('user-agent') || '' },
        clientIP
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
