import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { rateLimit, rateLimitConfigs } from '@/lib/core/rateLimit';
import {
  withAPIParams,
  createErrorResponse,
} from '@/lib/middleware';
import {
  getFileMetadata,
  incrementDownloadCount,
  saveSecurityEvent,
  User,
} from '@/lib/database/models';

/**
 * GET /api/files/[filename]
 * 
 * Downloads a file by filename. Supports both public and password-protected files.
 * For password-protected files, users must access via the shared link route.
 * Includes rate limiting and comprehensive security logging.
 */
export const GET = withAPIParams<{ filename: string }>(
  async (request: NextRequest, { params }): Promise<NextResponse> => {
    const { filename } = await params;

    // Get client IP and user agent for logging
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Apply rate limiting for downloads
    const rateLimitCheck = rateLimit(rateLimitConfigs.download)(request);

    if (!rateLimitCheck.success) {
      // Log rate limit hit
      await saveSecurityEvent({
        type: 'rate_limit',
        ip: clientIP,
        details: `Download rate limit exceeded: ${rateLimitCheck.message}`,
        severity: 'medium',
        userAgent,
      });

      const headers = new Headers();
      headers.set('X-RateLimit-Limit', rateLimitCheck.limit.toString());
      headers.set('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());
      headers.set('X-RateLimit-Reset', rateLimitCheck.reset.toISOString());      return createErrorResponse(
        rateLimitCheck.message || 'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        429,
        {
          rateLimit: {
            limit: rateLimitCheck.limit,
            remaining: rateLimitCheck.remaining,
            reset: rateLimitCheck.reset,
          },
        }
      );
    }

    if (!filename) {
      return createErrorResponse('Filename is required', 'MISSING_FILENAME', 400);
    }

    // Validate filename to prevent path traversal
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Path traversal attempt detected: ${filename}`,
        severity: 'high',
        userAgent,
        metadata: { filename },
      });

      return createErrorResponse('Invalid filename', 'INVALID_FILENAME', 400);
    }

    // Check file metadata in database
    const fileMetadata = await getFileMetadata(filename);

    if (!fileMetadata) {
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Attempt to access non-existent file: ${filename}`,
        severity: 'medium',
        userAgent,
        metadata: { filename },
      });

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }

    // Check if file has expired
    if (fileMetadata.expiresAt && new Date() > fileMetadata.expiresAt) {
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Attempt to access expired file: ${filename}`,
        severity: 'low',
        userAgent,
        metadata: { filename },
      });

      return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
    }

    // Check if file is password protected
    if (fileMetadata.isPasswordProtected) {
      // Log unauthorized access attempt to password-protected file
      await saveSecurityEvent({
        type: 'unauthorized_access',
        ip: clientIP,
        details: `Direct access attempt to password-protected file: ${filename}`,
        severity: 'high',
        userAgent,
        metadata: { filename },
      });

      return createErrorResponse(
        'Password required. Please use the shared link to access this file.',
        'PASSWORD_REQUIRED',
        403
      );
    }

    // Determine which subdirectory to check based on password protection
    const subDir = fileMetadata.isPasswordProtected ? 'protected' : 'public';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    const filePath = path.join(uploadsDir, filename);

    try {
      // Check if file exists on filesystem
      await fs.access(filePath);

      // Read file
      const fileBuffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);

      // Update download count in database
      await incrementDownloadCount(filename);

      // Update lastActivity for authenticated users
      if (fileMetadata.userId) {
        await User.findByIdAndUpdate(fileMetadata.userId, {
          lastActivity: new Date(),
        }).catch((err) => {
          // Don't fail the download if lastActivity update fails
          console.error('Failed to update lastActivity:', err);
        });
      }

      // Get file extension to determine content type
      const ext = path.extname(filename).toLowerCase();
      const contentType = getContentType(ext);

      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', stats.size.toString());
      headers.set(
        'Content-Disposition',
        `inline; filename="${fileMetadata.originalName}"`
      );

      // Log successful download
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `File downloaded: ${filename}`,
        severity: 'low',
        userAgent,
        metadata: {
          filename: fileMetadata.originalName,
          fileSize: fileMetadata.size,
          fileType: fileMetadata.mimeType,
          userId: fileMetadata.userId || undefined,
        },
      });

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });    } catch {
      // File exists in database but not on filesystem
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `File metadata exists but file missing from filesystem: ${filename}`,
        severity: 'high',
        userAgent,
        metadata: { filename },
      });

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }
  }
);

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
  };

  return contentTypes[ext] || 'application/octet-stream';
}
