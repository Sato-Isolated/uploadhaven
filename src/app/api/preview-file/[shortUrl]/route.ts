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
import { getClientIP } from '@/lib/core/utils';

/**
 * GET /api/preview-file/[shortUrl]
 *
 * Preview a file without counting it as a download.
 * Used for displaying files in the preview interface.
 *
 * Key differences from download API:
 * - Does NOT increment download count
 * - Logs as "file_preview" instead of "file_download"
 * - Same security checks (password, expiration, etc.)
 */
export const GET = withAPIParams<{ shortUrl: string }>(
  async (request: NextRequest, { params }): Promise<NextResponse> => {
    const { shortUrl } = await params;

    // Get client IP and user agent for logging
    const clientIP = getClientIP(request);
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
        details: `Preview attempt for non-existent file: ${shortUrl}`,
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
        details: `Preview attempt for expired file: ${fileDoc.originalName}`,
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

    // Check password protection
    if (fileDoc.isPasswordProtected) {
      const password = request.nextUrl.searchParams.get('password');
      if (!password || password !== fileDoc.password) {
        // Log failed password attempt
        await saveSecurityEvent({
          type: 'suspicious_activity',
          ip: clientIP,
          details: `Failed password attempt for file preview: ${fileDoc.originalName}`,
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

    // Handle Zero-Knowledge files - reject them as per new architecture
    if (fileDoc.isZeroKnowledge) {
      // Log the rejection attempt
      await saveSecurityEvent({
        type: 'access_denied',
        ip: clientIP,
        details: `ZK file preview rejected (use /api/zk-blob/ instead): ${fileDoc.originalName}`,
        severity: 'low',
        userAgent,
        metadata: {
          shortUrl,
          filename: fileDoc.filename,
          reason: 'zk_file_rejected_from_preview_api',
          redirectTo: '/api/zk-blob/',
        },
      });

      return createErrorResponse(
        'Zero-Knowledge files not supported in preview API. Use /api/zk-blob/ for encrypted files.',
        'UNSUPPORTED_FILE_TYPE',
        400,
        {
          isZeroKnowledge: true,
          redirectEndpoint: `/api/zk-blob/${fileDoc.shortUrl}`,
        }
      );
    }

    // Construct file path
    const filePath = path.join(
      process.cwd(),
      process.env.NODE_ENV === 'production'
        ? '/var/data/uploads'
        : 'public/uploads',
      fileDoc.filename
    );

    try {
      // Read the file from disk
      const fileBuffer = await readFile(filePath);

      // Log successful preview (NOT download)
      await saveSecurityEvent({
        type: 'file_preview',
        ip: clientIP,
        details: `File previewed: ${fileDoc.originalName}`,
        severity: 'low',
        userAgent,
        metadata: {
          shortUrl,
          filename: fileDoc.filename,
          fileSize: fileDoc.size,
          fileType: fileDoc.mimeType,
        },
      });

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': fileDoc.mimeType,
          'Content-Length': fileDoc.size.toString(),
          'Cache-Control': 'public, max-age=1800',
          'Content-Disposition': `inline; filename="${fileDoc.originalName}"`,
        },
      });
    } catch (fileError) {
      console.error('Preview file error:', fileError);

      // Log failed file access
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Failed to preview file: ${fileDoc.originalName} - ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
        severity: 'medium',
        userAgent,
        metadata: {
          shortUrl,
          filename: fileDoc.filename,
        },
      });

      return createErrorResponse('File not found or corrupted', 'FILE_ACCESS_ERROR', 404);
    }
  }
);
