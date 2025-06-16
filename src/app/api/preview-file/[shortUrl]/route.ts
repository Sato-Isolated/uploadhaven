import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { File, saveSecurityEvent } from '@/lib/database/models';
import { checkFileExpiration } from '@/lib/background/startup';
import path from 'path';
import { getClientIP } from '@/lib/core/utils';
import {
  readAndDecryptFile,
  getContentLength,
  logDecryptionActivity,
} from '@/lib/encryption/file-decryption';

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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortUrl: string }> }
) {
  try {
    await connectDB();
    const { shortUrl } = await params;

    // Get client IP and user agent for logging
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Find file by short URL
    const fileDoc = await File.findOne({
      shortUrl,
      isDeleted: false,
    });

    if (!fileDoc) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      await checkFileExpiration(fileDoc._id.toString());
      return NextResponse.json(
        { success: false, error: 'File has expired' },
        { status: 410 }
      );
    }

    // Check for instant expiration
    const wasDeleted = await checkFileExpiration(fileDoc._id.toString());
    if (wasDeleted) {
      return NextResponse.json(
        { success: false, error: 'File has expired' },
        { status: 410 }
      );
    } // Password protection check
    if (fileDoc.isPasswordProtected && fileDoc.password) {
      const password = request.nextUrl.searchParams.get('password');
      if (!password) {
        return NextResponse.json(
          {
            success: false,
            error: 'Password required',
            passwordRequired: true,
          },
          { status: 401 }
        );
      }

      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, fileDoc.password);
      if (!isValidPassword) {
        // Log failed password attempt
        await saveSecurityEvent({
          type: 'suspicious_activity',
          ip: clientIP,
          details: `Failed password attempt for file preview: ${fileDoc.originalName}`,
          severity: 'medium',
          userAgent,
          filename: fileDoc.filename,
        });

        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Build file path - fileDoc.filename already contains the full path from uploads directory
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      fileDoc.filename
    );

    try {
      // Debug: Log file information
      console.log('🔍 PREVIEW DEBUG - File Info:');
      console.log(`   Original name: ${fileDoc.originalName}`);
      console.log(`   Filename: ${fileDoc.filename}`);
      console.log(`   Is encrypted: ${fileDoc.isEncrypted}`);
      console.log(
        `   Has encryption metadata: ${!!fileDoc.encryptionMetadata}`
      );
      if (fileDoc.encryptionMetadata) {
        console.log(`   Algorithm: ${fileDoc.encryptionMetadata.algorithm}`);
        console.log(`   Has salt: ${!!fileDoc.encryptionMetadata.salt}`);
        console.log(`   Has IV: ${!!fileDoc.encryptionMetadata.iv}`);
        console.log(`   Has tag: ${!!fileDoc.encryptionMetadata.tag}`);
      }

      // Read and decrypt file if necessary
      const fileBuffer = await readAndDecryptFile(filePath, fileDoc);

      console.log(`📄 Buffer info after decryption:`);
      console.log(`   Size: ${fileBuffer.length} bytes`);
      console.log(
        `   First 50 chars: ${fileBuffer.toString('utf8', 0, 50).replace(/\n/g, '\\n')}`
      );

      // Log decryption activity if file was encrypted
      logDecryptionActivity(fileDoc, 'preview', clientIP, userAgent);

      // Log successful preview (NOT download)
      await saveSecurityEvent({
        type: 'file_preview', // Different event type
        ip: clientIP,
        details: `File previewed: ${fileDoc.originalName}${fileDoc.isEncrypted ? ' (decrypted)' : ''}`,
        severity: 'low',
        userAgent,
        filename: fileDoc.filename,
        fileSize: fileDoc.size,
        fileType: fileDoc.mimeType,
      });

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': fileDoc.mimeType,
          'Content-Length': getContentLength(fileDoc).toString(),
          'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
          'Content-Disposition': `inline; filename="${fileDoc.originalName}"`, // inline for preview
        },
      });
    } catch (error) {
      console.error('Preview file error:', error);

      // Log failed file access
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Failed to preview file: ${fileDoc.originalName} - ${error}`,
        severity: 'medium',
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: 'File not found or corrupted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
