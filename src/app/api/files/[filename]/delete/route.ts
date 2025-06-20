import { withAuthenticatedAPIParams, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File } from '@/lib/database/models';
import { logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';
import { headers } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';

export const DELETE = withAuthenticatedAPIParams<{ filename: string }>(
  async (request: AuthenticatedRequest, { params }) => {
    const { user } = request;
    const { filename } = await params;

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown';

    // Find the file in database
    const fileRecord = await File.findOne({ filename, isDeleted: false });    if (!fileRecord) {
      // Log security event for attempted deletion of non-existent file
      await logSecurityEvent(
        'delete_nonexistent_file',
        `Attempted to delete non-existent file: ${filename}`,
        'medium',
        false,
        {
          filename,
          threatType: 'invalid_operation'
        },
        ip
      );

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }    // Check if user owns the file (only authenticated users can have ownership)
    if (fileRecord.userId && fileRecord.userId.toString() !== user.id) {
      // Log unauthorized deletion attempt
      await logSecurityEvent(
        'unauthorized_delete_attempt',
        `User ${user.id} attempted to delete file owned by ${fileRecord.userId}: ${filename}`,
        'high',
        true,
        {
          filename,
          targetUserId: fileRecord.userId.toString(),
          attemptingUserId: user.id,
          threatType: 'unauthorized_access',
          blockedReason: 'User attempted to delete another user\'s file'
        },
        ip
      );

      return createErrorResponse('Unauthorized: You can only delete your own files', 'UNAUTHORIZED', 403);
    }    // For files without userId (public files), check if user is admin
    if (!fileRecord.userId && user.role !== 'admin') {
      await logSecurityEvent(
        'unauthorized_public_file_delete',
        `Non-admin user ${user.id} attempted to delete public file: ${filename}`,
        'high',
        true,
        {
          filename,
          userId: user.id,
          userRole: user.role,
          threatType: 'unauthorized_access',
          blockedReason: 'Non-admin user attempted to delete public file'
        },
        ip
      );

      return createErrorResponse('Unauthorized: Only admins can delete public files', 'FORBIDDEN', 403);
    }

    // Mark file as deleted in database (soft delete)
    await File.findOneAndUpdate({ filename }, { isDeleted: true });

    // Try to delete the actual file from filesystem
    try {
      // Determine which subdirectory based on password protection
      const subDir = fileRecord.isPasswordProtected ? 'protected' : 'public';
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
      const filePath = path.join(uploadsDir, filename);
      await unlink(filePath);
    } catch (fsError) {
      // File might already be deleted or not exist on filesystem
      console.warn(`Could not delete file from filesystem: ${filename}`, fsError);
    }    // Log successful deletion
    await logFileOperation(
      'file_delete',
      `File deleted: ${fileRecord.originalName} (${filename})`,
      fileRecord._id?.toString() || 'unknown',
      fileRecord.originalName,
      filename,
      user.id,
      {
        fileSize: fileRecord.size,
        mimeType: fileRecord.mimeType,
        encrypted: false,
        passwordProtected: fileRecord.isPasswordProtected || false,
        softDelete: true
      },
      ip
    );

    return createSuccessResponse({ message: 'File deleted successfully' });
  }
);
