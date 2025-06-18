import { NextRequest } from 'next/server';
import { withAdminAPIParams, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { User, saveSecurityEvent } from '@/lib/database/models';

export const PATCH = withAdminAPIParams<{ userId: string }>(
  async (request: AuthenticatedRequest, { params }) => {
    try {
      const { userId } = await params;
      const { role } = await request.json();

      if (!userId) {
        return createErrorResponse('User ID is required', 'INVALID_INPUT', 400);
      }

      if (!role || !['admin', 'user'].includes(role)) {
        return createErrorResponse('Valid role (admin or user) is required', 'INVALID_INPUT', 400);
      }

      // Find the user
      const user = await User.findById(userId);

      if (!user) {
        return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
      }

      const oldRole = user.role;

      // Update user role
      await User.findByIdAndUpdate(userId, { role });

      // Log security event
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';

      await saveSecurityEvent({
        type: 'user_role_changed',
        ip: clientIP,
        details: `User ${user.email} role changed from ${oldRole} to ${role} by admin`,
        severity: 'high',
        userAgent,
        metadata: {
          userId: userId,
          userEmail: user.email,
          oldRole,
          newRole: role,
          adminAction: true,
        },
      });

      return createSuccessResponse({
        message: `User ${user.email} role updated to ${role} successfully`,
      });
    } catch (error) {
      console.error('User role update error:', error);
      return createErrorResponse(
        'Failed to update user role',
        'USER_ROLE_UPDATE_FAILED',
        500
      );
    }
  }
);
