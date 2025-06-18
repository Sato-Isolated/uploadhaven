import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import {
  withAPIParams,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware';
import { File, saveSecurityEvent } from '@/lib/database/models';
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
    });

    if (!fileDoc) {
      await saveSecurityEvent({
        type: 'access_denied',
        ip: clientIP,
        details: `Thumbnail attempt for non-existent file: ${shortUrl}`,
        severity: 'medium',
        userAgent,
        metadata: { shortUrl },
      });

      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }

    // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      await checkFileExpiration(fileDoc._id.toString());
      
      await saveSecurityEvent({
        type: 'access_denied',
        ip: clientIP,
        details: `Thumbnail attempt for expired file: ${fileDoc.originalName}`,
        severity: 'low',
        userAgent,
        metadata: { 
          shortUrl,
          filename: fileDoc.filename,
          expiredAt: fileDoc.expiresAt 
        },
      });

      return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
    }

    // Check for instant expiration
    const wasDeleted = await checkFileExpiration(fileDoc._id.toString());
    if (wasDeleted) {
      return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
    }

    // For Zero-Knowledge files, thumbnails are not supported
    // as they would require client-side decryption
    if (fileDoc.isZeroKnowledge) {
      await saveSecurityEvent({
        type: 'access_denied',
        ip: clientIP,
        details: `Thumbnail rejected for ZK file: ${fileDoc.originalName}`,
        severity: 'low',
        userAgent,
        metadata: { 
          shortUrl,
          filename: fileDoc.filename,
          reason: 'zk_file_thumbnail_not_supported' 
        },
      });

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
      }

      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, fileDoc.password);
      if (!isValidPassword) {
        await saveSecurityEvent({
          type: 'suspicious_activity',
          ip: clientIP,
          details: `Failed password attempt for thumbnail: ${fileDoc.originalName}`,
          severity: 'medium',
          userAgent,
          metadata: { 
            shortUrl,
            filename: fileDoc.filename 
          },
        });

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

      const sourceBuffer = await readFile(filePath);

      // Simple thumbnail generation (basic implementation)
      // For now, return the original file if it's an image
      if (mimeType.startsWith('image/')) {
        // Log successful thumbnail request
        await saveSecurityEvent({
          type: 'file_download',
          ip: clientIP,
          details: `Thumbnail served for: ${fileDoc.originalName}`,
          severity: 'low',
          userAgent,
          metadata: {
            shortUrl,
            filename: fileDoc.filename,
            fileSize: fileDoc.size,
            fileType: fileDoc.mimeType,
          },
        });

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
      }
    } catch (fileError) {
      console.error('Thumbnail generation error:', fileError);

      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Failed to generate thumbnail: ${fileDoc.originalName} - ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
        severity: 'medium',
        userAgent,
        metadata: {
          shortUrl,
          filename: fileDoc.filename,
        },
      });

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
