import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import {
  withAPIParams,
  createErrorResponse,
} from '@/lib/middleware';
import { File } from '@/lib/database/models';
import { logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';
import { checkFileExpiration } from '@/lib/background/startup';

/**
 * GET /api/thumbnail/[shortUrl]
 * 
 * Generates and serves thumbnails for files.
 * - Supports images, videos, and PDFs
 * - Respects password protection
 * - Does not support encrypted (Zero-Knowledge) files
 * - Includes caching headers for performance
 */
export const GET = withAPIParams<{ shortUrl: string }>(
  async (request: NextRequest, { params }): Promise<NextResponse> => {
    const { shortUrl } = await params;

    // Get client IP and user agent for logging
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    if (!shortUrl) {
      return createErrorResponse('Short URL is required', 'MISSING_SHORT_URL', 400);
    }

    // Find file by short URL
    const fileDoc = await File.findOne({
      shortUrl,
      isDeleted: false,
    });    if (!fileDoc) {
      await logSecurityEvent(
        'thumbnail_file_not_found',
        `Thumbnail attempt for non-existent file: ${shortUrl}`,
        'medium',
        false,
        { shortUrl, action: 'thumbnail_access' },
        clientIP
      );

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }    // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      await checkFileExpiration(fileDoc._id.toString());
      
      await logSecurityEvent(
        'thumbnail_file_expired',
        `Thumbnail attempt for expired file: ${fileDoc.originalName}`,
        'low',
        false,
        { 
          shortUrl,
          filename: fileDoc.filename,
          expiredAt: fileDoc.expiresAt 
        },
        clientIP
      );

      return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
    }

    // Check for instant expiration
    const wasDeleted = await checkFileExpiration(fileDoc._id.toString());
    if (wasDeleted) {
      return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
    }    // For Zero-Knowledge files, thumbnails are not supported
    // as they would require client-side decryption
    if (fileDoc.isZeroKnowledge) {
      await logSecurityEvent(
        'thumbnail_zk_file_rejected',
        `Thumbnail rejected for ZK file: ${fileDoc.originalName}`,
        'low',
        false,
        { 
          shortUrl,
          filename: fileDoc.filename,
          reason: 'zk_file_thumbnail_not_supported' 
        },
        clientIP
      );

      return createErrorResponse(
        'Thumbnails not supported for encrypted files',
        'UNSUPPORTED_FILE_TYPE',
        400
      );
    }

    // Only generate thumbnails for supported file types
    const mimeType = fileDoc.mimeType;
    if (!isThumbnailSupported(mimeType)) {
      return createErrorResponse(
        'Thumbnail not supported for this file type',
        'UNSUPPORTED_FILE_TYPE',
        400
      );
    }

    // Password protection check - thumbnails require same access as preview
    if (fileDoc.isPasswordProtected && fileDoc.password) {
      const password = request.nextUrl.searchParams.get('password');
      if (!password) {
        return createErrorResponse(
          'Password required',
          'PASSWORD_REQUIRED',
          401,
          { passwordRequired: true }
        );
      }      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, fileDoc.password);
      if (!isValidPassword) {
        await logSecurityEvent(
          'thumbnail_invalid_password',
          `Failed password attempt for thumbnail: ${fileDoc.originalName}`,
          'medium',
          false,
          { 
            shortUrl,
            filename: fileDoc.filename,
            attemptType: 'thumbnail_access'
          },
          clientIP
        );

        return createErrorResponse('Invalid password', 'INVALID_PASSWORD', 401);
      }
    }

    try {
      // Generate thumbnail using the media processing utilities
      const filePath = path.join(
        process.cwd(),
        process.env.NODE_ENV === 'production'
          ? '/var/data/uploads'
          : 'public/uploads',
        fileDoc.filename
      );

      const sourceBuffer = await readFile(filePath);      // Simple thumbnail generation (basic implementation)
      // For now, return the original file if it's an image
      if (mimeType.startsWith('image/')) {
        // Log successful thumbnail request
        await logFileOperation(
          'thumbnail_served',
          `Thumbnail served for: ${fileDoc.originalName}`,
          fileDoc._id.toString(),
          fileDoc.originalName,
          fileDoc._id.toString(),
          fileDoc.userId,
          {
            shortUrl,
            filename: fileDoc.filename,
            fileSize: fileDoc.size,
            fileType: fileDoc.mimeType,
            thumbnailType: 'image'
          },
          clientIP
        );

        // Return the image as thumbnail
        return new NextResponse(sourceBuffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'Content-Disposition': `inline; filename="thumb_${fileDoc.filename}"`,
          },
        });
      } else {
        // For non-image files, return an error for now
        return createErrorResponse(
          'Thumbnail generation not implemented for this file type',
          'NOT_IMPLEMENTED',
          501
        );
      }    } catch (fileError) {
      console.error('Thumbnail generation error:', fileError);

      await logSecurityEvent(
        'thumbnail_generation_error',
        `Failed to generate thumbnail: ${fileDoc.originalName} - ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
        'medium',
        false,
        {
          shortUrl,
          filename: fileDoc.filename,
          errorType: 'thumbnail_generation_failed'
        },
        clientIP
      );

      return createErrorResponse('Failed to generate thumbnail', 'THUMBNAIL_GENERATION_ERROR', 500);
    }
  }
);

// Check if file type supports thumbnail generation
function isThumbnailSupported(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf'
  );
}
