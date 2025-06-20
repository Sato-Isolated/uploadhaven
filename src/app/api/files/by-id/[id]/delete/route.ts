import { withAuthenticatedAPIParams, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File } from '@/lib/database/models';
import { logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';
import { headers } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';

export const DELETE = withAuthenticatedAPIParams<{ id: string }>(
  async (request: AuthenticatedRequest, { params }) => {
    const { user } = request;
    const { id } = await params;

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown';

    // Validate ID format
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid file ID', 'INVALID_ID', 400);
    }    // Find the file in database by ID
    const fileRecord = await File.findOne({ _id: id, isDeleted: false });
    if (!fileRecord) {
      // Log security event for attempted deletion of non-existent file
      await logSecurityEvent(
        'file_delete_not_found',
        `Attempted to delete non-existent file ID: ${id}`,
        'medium',
        false,
        { fileId: id, attemptType: 'delete_by_id' },
        ip
      );

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }    // Check if user owns the file (only authenticated users can have ownership)
    if (fileRecord.userId && fileRecord.userId.toString() !== user.id) {
      // Log unauthorized deletion attempt
      await logSecurityEvent(
        'file_delete_unauthorized',
        `User ${user.id} attempted to delete file owned by ${fileRecord.userId}: ${fileRecord.filename}`,
        'high',
        false,
        { 
          fileId: id,
          filename: fileRecord.filename,
          ownerId: fileRecord.userId,
          attempterId: user.id
        },
        ip
      );

      return createErrorResponse('Unauthorized: You can only delete your own files', 'UNAUTHORIZED', 403);
    }    // For files without userId (public files), check if user is admin
    if (!fileRecord.userId && user.role !== 'admin') {
      await logSecurityEvent(
        'file_delete_admin_required',
        `Non-admin user ${user.id} attempted to delete public file: ${fileRecord.filename}`,
        'high',
        false,
        { 
          fileId: id,
          filename: fileRecord.filename,
          attempterId: user.id,
          userRole: user.role
        },
        ip
      );

      return createErrorResponse('Unauthorized: Only admins can delete public files', 'FORBIDDEN', 403);
    }

    // Mark file as deleted in database (soft delete)
    await File.findOneAndUpdate({ _id: id }, { isDeleted: true });

    // Try to delete the actual file from filesystem
    try {
      // Determine which subdirectory based on password protection
      const subDir = fileRecord.isPasswordProtected ? 'protected' : 'public';
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
      const filePath = path.join(uploadsDir, fileRecord.filename);
      await unlink(filePath);
    } catch (fsError) {
      // File might already be deleted or not exist on filesystem
      console.warn(`Could not delete file from filesystem: ${fileRecord.filename}`, fsError);
    }    // Log successful deletion
    await logFileOperation(
      'file_deleted',
      `File deleted: ${fileRecord.originalName} (${fileRecord.filename})`,
      fileRecord._id.toString(),
      fileRecord.originalName,
      fileRecord._id.toString(),
      user.id,
      {
        filename: fileRecord.filename,
        fileSize: fileRecord.size,
        fileType: fileRecord.mimeType,
        deleteMethod: 'api_by_id'
      },
      ip
    );

    return createSuccessResponse({ message: 'File deleted successfully' });
  }
);
