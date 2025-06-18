import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';
import {
  withAdminAPIParams,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware';
import { User, File, saveSecurityEvent } from '@/lib/database/models';

/**
 * DELETE /api/admin/users/[userId]/delete
 * 
 * Delete a user and all their associated files.
 * Requires admin authentication.
 * Includes safety measures to prevent admin deletion.
 */
export const DELETE = withAdminAPIParams<{ userId: string }>(
  async (request: NextRequest, { params }) => {
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown';

    const { userId } = await params;

    if (!userId) {
      return createErrorResponse('User ID is required', 'MISSING_USER_ID', 400);
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    // Prevent deletion of admin users (safety measure)
    if (user.role === 'admin') {
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip,
        details: `Attempt to delete admin user: ${user.email}`,
        severity: 'high',
        userAgent,
        metadata: {
          userId: userId,
          userEmail: user.email,
          reason: 'admin_deletion_blocked',
        },
      });

      return createErrorResponse('Cannot delete admin users', 'ADMIN_DELETION_FORBIDDEN', 403);
    }

    try {
      // Find all files uploaded by the user
      const userFiles = await File.find({ userId: userId });

      // Delete physical files from storage
      const deletionPromises = userFiles.map(async (file) => {
        try {
          const filePath = path.join(
            process.cwd(),
            'public',
            'uploads',
            file.filename
          );
          await unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete file ${file.filename}:`, error);
          // Continue with deletion even if physical file removal fails
        }
      });

      await Promise.allSettled(deletionPromises);

      // Delete file records from database
      await File.deleteMany({ userId: userId });

      // Delete the user
      await User.findByIdAndDelete(userId);

      // Log security event
      await saveSecurityEvent({
        type: 'user_deleted',
        ip,
        details: `User ${user.email} has been deleted by admin (including ${userFiles.length} files)`,
        severity: 'high',
        userAgent,
        metadata: {
          userId: userId,
          userEmail: user.email,
          deletedFilesCount: userFiles.length,
          adminAction: true,
        },
      });

      return createSuccessResponse({
        message: `User ${user.email} and ${userFiles.length} associated files have been deleted successfully`,
        deletedFilesCount: userFiles.length,
      });
    } catch (error) {
      console.error('User deletion error:', error);

      // Log the error
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip,
        details: `Failed to delete user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        userAgent,
        metadata: {
          userId: userId,
          userEmail: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return createErrorResponse('Failed to delete user', 'USER_DELETION_ERROR', 500);
    }
  }
);
