import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { withAPIParams, createErrorResponse } from '@/lib/middleware';
import { File, saveSecurityEvent } from '@/lib/database/models';
import { rateLimit, rateLimitConfigs } from '@/lib/core/rateLimit';

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
      });

      if (!file) {
        // Log potential scanning attempt
        await saveSecurityEvent({
          type: 'suspicious_activity',
          ip: clientIP,
          details: `Download attempt for non-existent file: ${shortUrl}`,
          severity: 'low',
          userAgent,
        });
        
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

        // Log download event
        await saveSecurityEvent({
          type: 'file_download',
          ip: clientIP,
          details: `File downloaded: ${file.filename} (${shortUrl})`,
          severity: 'info',
          userAgent,
        });

        // Return file
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${file.originalName}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      } catch {
        // File exists in database but not on filesystem
        await saveSecurityEvent({
          type: 'suspicious_activity',
          ip: clientIP,
          details: `File metadata exists but file missing from filesystem: ${file.filename}`,
          severity: 'high',
          userAgent,
        });
        
        return createErrorResponse('File not available', 'FILE_UNAVAILABLE', 500);
      }
    } catch (error) {
      console.error('Download error:', error);
      return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
);