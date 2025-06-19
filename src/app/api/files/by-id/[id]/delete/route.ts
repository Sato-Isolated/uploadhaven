import { withAuthenticatedAPIParams, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File, saveSecurityEvent } from '@/lib/database/models';
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
    }

    // Find the file in database by ID
    const fileRecord = await File.findOne({ _id: id, isDeleted: false });
    if (!fileRecord) {
      // Log security event for attempted deletion of non-existent file
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip,
        details: `Attempted to delete non-existent file ID: ${id}`,
        severity: 'medium',
        userAgent,
        filename: id,
      });

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }

    // Check if user owns the file (only authenticated users can have ownership)
    if (fileRecord.userId && fileRecord.userId.toString() !== user.id) {
      // Log unauthorized deletion attempt
      await saveSecurityEvent({
        type: 'unauthorized_access',
        ip,
        details: `User ${user.id} attempted to delete file owned by ${fileRecord.userId}: ${fileRecord.filename}`,
        severity: 'high',
        userAgent,
        filename: fileRecord.filename,
      });

      return createErrorResponse('Unauthorized: You can only delete your own files', 'UNAUTHORIZED', 403);
    }

    // For files without userId (public files), check if user is admin
    if (!fileRecord.userId && user.role !== 'admin') {
      await saveSecurityEvent({
        type: 'unauthorized_access',
        ip,
        details: `Non-admin user ${user.id} attempted to delete public file: ${fileRecord.filename}`,
        severity: 'high',
        userAgent,
        filename: fileRecord.filename,
      });

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
    }

    // Log successful deletion
    await saveSecurityEvent({
      type: 'file_deletion',
      ip,
      details: `File deleted: ${fileRecord.originalName} (${fileRecord.filename})`,
      severity: 'low',
      userAgent,
      filename: fileRecord.filename,
      fileSize: fileRecord.size,
      fileType: fileRecord.mimeType,
    });

    return createSuccessResponse({ message: 'File deleted successfully' });
  }
);
