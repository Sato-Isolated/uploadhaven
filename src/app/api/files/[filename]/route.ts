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
  User,
} from '@/lib/database/models';
import { logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';

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
    const rateLimitCheck = rateLimit(rateLimitConfigs.download)(request);    if (!rateLimitCheck.success) {
      // Log rate limit hit
      await logSecurityEvent(
        'rate_limit_exceeded',
        `Download rate limit exceeded: ${rateLimitCheck.message}`,
        'medium',
        true,
        {
          endpoint: '/api/files/[filename]',
          threatType: 'rate_limit_exceeded',
          blockedReason: 'Download rate limit exceeded'
        },
        clientIP
      );

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
    }    // Validate filename to prevent path traversal
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      await logSecurityEvent(
        'path_traversal_attempt',
        `Path traversal attempt detected: ${filename}`,
        'high',
        true,
        {
          filename,
          threatType: 'path_traversal',
          blockedReason: 'Suspicious filename detected'
        },
        clientIP
      );

      return createErrorResponse('Invalid filename', 'INVALID_FILENAME', 400);
    }

    // Check file metadata in database
    const fileMetadata = await getFileMetadata(filename);    if (!fileMetadata) {
      await logSecurityEvent(
        'file_not_found',
        `Attempt to access non-existent file: ${filename}`,
        'medium',
        false,
        {
          filename,
          threatType: 'invalid_access'
        },
        clientIP
      );

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }    // Check if file has expired
    if (fileMetadata.expiresAt && new Date() > fileMetadata.expiresAt) {
      await logSecurityEvent(
        'expired_file_access',
        `Attempt to access expired file: ${filename}`,
        'low',
        false,
        {
          filename,
          expiresAt: fileMetadata.expiresAt,
          threatType: 'expired_access'
        },
        clientIP
      );

      return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
    }    // Check if file is password protected
    if (fileMetadata.isPasswordProtected) {
      // Log unauthorized access attempt to password-protected file
      await logSecurityEvent(
        'unauthorized_access_attempt',
        `Direct access attempt to password-protected file: ${filename}`,
        'high',
        true,
        {
          filename,
          threatType: 'unauthorized_access',
          blockedReason: 'Attempted direct access to password-protected file'
        },
        clientIP
      );

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
      );      // Log successful download
      await logFileOperation(
        'file_download',
        `File downloaded: ${filename}`,
        fileMetadata._id?.toString() || 'unknown',
        fileMetadata.originalName,
        filename,
        fileMetadata.userId,
        {
          fileSize: fileMetadata.size,
          mimeType: fileMetadata.mimeType,
          downloadCount: fileMetadata.downloadCount + 1,
          encrypted: false,
          passwordProtected: fileMetadata.isPasswordProtected
        },
        clientIP
      );

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });    } catch {
      // File exists in database but not on filesystem
      await logSecurityEvent(
        'file_system_inconsistency',
        `File metadata exists but file missing from filesystem: ${filename}`,
        'high',
        false,
        {
          filename,
          threatType: 'system_error',
          issue: 'database_filesystem_mismatch'
        },
        clientIP
      );

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
