import { NextRequest } from 'next/server';
import { withAdminAPIParams, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { User, saveSecurityEvent } from '@/lib/database/models';

export const POST = withAdminAPIParams<{ userId: string }>(
  async (request: AuthenticatedRequest, { params }) => {
    try {
      const { userId } = await params;

      if (!userId) {
        return createErrorResponse('User ID is required', 'INVALID_INPUT', 400);
      }

      // Find the user
      const user = await User.findById(userId);

      if (!user) {
        return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
      }

      if (user.emailVerified) {
        return createErrorResponse('User email is already verified', 'EMAIL_ALREADY_VERIFIED', 400);
      }

      // TODO: Implement actual email sending logic
      // For now, we'll just log the event and return success
      // In a real implementation, you would:
      // 1. Generate a new verification token
      // 2. Save it to the user record
      // 3. Send an email with the verification link

      // Log security event
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';

      await saveSecurityEvent({
        type: 'verification_email_resent',
        ip: clientIP,
        details: `Verification email resent for user ${user.email} by admin`,
        severity: 'low',
        userAgent,
        metadata: {
          userId: userId,
          userEmail: user.email,
          adminAction: true,
        },
      });

      return createSuccessResponse({
        message: `Verification email sent to ${user.email} successfully`,
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      return createErrorResponse(
        'Failed to resend verification email',
        'VERIFICATION_EMAIL_FAILED',
        500
      );
    }
  }
);
