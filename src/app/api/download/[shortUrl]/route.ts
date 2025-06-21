import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { withAPIParams, createErrorResponse } from '@/lib/middleware';
import { File } from '@/lib/database/models';
import { logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';
import { rateLimit, rateLimitConfigs } from '@/lib/core/rateLimit';
import { fileEventNotificationService } from '@/lib/notifications/file-event-notifications';

export const GET = withAPIParams<{ shortUrl: string }>(
  async (request: NextRequest, { params }): Promise<NextResponse> => {
    const { shortUrl } = await params;
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Apply rate limiting for downloads
    const rateLimitCheck = rateLimit(rateLimitConfigs.download)(request);
    if (!rateLimitCheck.success) {
      return createErrorResponse(
        'Too many download attempts. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }

    try {
      // Find file by shortUrl
      const file = await File.findOne({ 
        shortUrl, 
        isDeleted: false 
      });      if (!file) {
        // Log potential scanning attempt
        await logSecurityEvent(
          'download_nonexistent_file',
          `Download attempt for non-existent file: ${shortUrl}`,
          'low',
          false,
          {
            shortUrl,
            threatType: 'invalid_access'
          },
          clientIP
        );
        
        return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
      }

      // Check if file has expired
      if (file.expiresAt && new Date() > file.expiresAt) {
        return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
      }

      // Check download limits (if exists)
      if (file.downloadCount && file.downloadCount >= 100) { // Default limit
        return createErrorResponse('Download limit reached', 'DOWNLOAD_LIMIT_REACHED', 410);
      }

      // Construct file path (assuming public uploads for now)
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'public', file.filename);

      try {
        // Check if file exists
        await fs.access(filePath);
        
        // Read file
        const fileBuffer = await fs.readFile(filePath);
          // Increment download count
        file.downloadCount = (file.downloadCount || 0) + 1;
        await file.save();

        // Send download notification to file owner
        try {
          await fileEventNotificationService.notifyFileDownloaded({
            fileId: file._id.toString(),
            filename: file.originalName,
            userId: file.userId,
            downloaderIP: clientIP,
            userAgent: userAgent,
            isPasswordProtected: file.isPasswordProtected || false,
            downloadCount: file.downloadCount,
          });
        } catch (notificationError) {
          console.error('Failed to send download notification:', notificationError);
          // Don't fail the download if notification fails
        }// Log download event
        await logFileOperation(
          'file_download',
          `File downloaded: ${file.filename} (${shortUrl})`,
          file._id?.toString() || 'unknown',
          file.originalName,
          shortUrl,
          file.userId,
          {
            fileSize: file.size,
            mimeType: file.mimeType,
            downloadCount: file.downloadCount,
            encrypted: false,
            passwordProtected: file.isPasswordProtected
          },
          clientIP
        );

        // Return file
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${file.originalName}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        });      } catch {
        // File exists in database but not on filesystem
        await logSecurityEvent(
          'file_system_inconsistency',
          `File metadata exists but file missing from filesystem: ${file.filename}`,
          'high',
          false,
          {
            filename: file.filename,
            shortUrl,
            threatType: 'system_error',
            issue: 'database_filesystem_mismatch'
          },
          clientIP
        );
        
        return createErrorResponse('File not available', 'FILE_UNAVAILABLE', 500);
      }
    } catch (error) {
      console.error('Download error:', error);
      return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
);