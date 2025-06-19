import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withAdminAPI } from '@/lib/middleware';
import { File } from '@/lib/database/models';
import type { AuthenticatedRequest } from '@/lib/middleware/auth';
import { unlink } from 'fs/promises';
import path from 'path';

async function deleteFileHandler(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Try to find the file with exact filename or with path prefix
    let fileRecord = await File.findOne({ filename, isDeleted: false });
    
    if (!fileRecord) {
      // Try with common path prefixes
      const pathVariants = [
        `public/${filename}`,
        `protected/${filename}`,
        filename
      ];
      
      for (const variant of pathVariants) {
        fileRecord = await File.findOne({ filename: variant, isDeleted: false });
        if (fileRecord) break;
      }
    }

    if (!fileRecord) {
      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }

    // Mark file as deleted in database (soft delete)
    await File.findOneAndUpdate({ _id: fileRecord._id }, { isDeleted: true });

    // Try to delete the actual file from filesystem
    try {
      // Determine which subdirectory based on password protection
      const subDir = fileRecord.isPasswordProtected ? 'protected' : 'public';
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
      
      // Extract just the filename without path for filesystem operations
      const actualFilename = fileRecord.filename.split('/').pop() || fileRecord.filename;
      const filePath = path.join(uploadsDir, actualFilename);
      
      await unlink(filePath);
    } catch (fsError) {
      // File might already be deleted or not exist on filesystem
      console.warn(`Could not delete file from filesystem: ${fileRecord.filename}`, fsError);
    }

    return createSuccessResponse({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Admin file deletion error:', error);
    return createErrorResponse('Failed to delete file', 'DELETE_FAILED', 500);
  }
}

/**
 * DELETE /api/admin/files/[filename]
 * Admin-only endpoint to delete any file
 */
export const DELETE = withAdminAPI(deleteFileHandler);
