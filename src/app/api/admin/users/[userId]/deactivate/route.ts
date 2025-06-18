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

      // Update user status to inactive
      await User.findByIdAndUpdate(userId, {
        isActive: false,
        deactivatedAt: new Date(),
      });      // Log security event
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';

      await saveSecurityEvent({
        type: 'user_deactivated',
        ip: clientIP,
        details: `User ${user.email} has been deactivated by admin`,
        severity: 'medium',
        userAgent,
        metadata: {
          userId: userId,
          userEmail: user.email,
          adminAction: true,
        },
      });

      return createSuccessResponse({
        message: `User ${user.email} has been deactivated successfully`,
      });
    } catch (error) {
      console.error('User deactivation error:', error);
      return createErrorResponse(
        'Failed to deactivate user',
        'USER_DEACTIVATION_FAILED',
        500
      );
    }
  }
);

// Endpoint to reactivate a user
export const PATCH = withAdminAPIParams<{ userId: string }>(
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

      // Update user status to active
      await User.findByIdAndUpdate(userId, {
        isActive: true,
        $unset: { deactivatedAt: 1 },
      });

      // Log security event
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';

      await saveSecurityEvent({
        type: 'user_reactivated',
        ip: clientIP,
        details: `User ${user.email} has been reactivated by admin`,
        severity: 'low',
        userAgent,
        metadata: {
          userId: userId,
          userEmail: user.email,
          adminAction: true,
        },
      });

      return createSuccessResponse({
        message: `User ${user.email} has been reactivated successfully`,
      });
    } catch (error) {
      console.error('User reactivation error:', error);
      return createErrorResponse(
        'Failed to reactivate user',
        'USER_REACTIVATION_FAILED',
        500
      );
    }
  }
);
