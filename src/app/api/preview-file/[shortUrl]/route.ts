import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { File, saveSecurityEvent } from '@/lib/database/models';
import { checkFileExpiration } from '@/lib/background/startup';
import path from 'path';
import { getClientIP } from '@/lib/core/utils';
import { readFile } from 'fs/promises';

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
          filename: fileDoc.filename,
        });

        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }
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
      let fileBuffer: Buffer;

      // Handle Zero-Knowledge files differently
      if (fileDoc.isZeroKnowledge) {
        // For ZK files, serve the encrypted blob as-is for client-side decryption
        fileBuffer = await readFile(filePath);

        // Log ZK file preview (NOT download)
        await saveSecurityEvent({
          type: 'file_preview',
          ip: clientIP,
          details: `Zero-Knowledge file previewed: ${fileDoc.originalName} (encrypted blob)`,
          severity: 'low',
          userAgent,
          filename: fileDoc.filename,
          fileSize: fileDoc.size,
          fileType: fileDoc.mimeType,
          metadata: {
            zeroKnowledge: true,
            algorithm: fileDoc.zkMetadata?.algorithm,
            keyType: fileDoc.zkMetadata?.keyHint,
          },
        });

        // Return encrypted blob with ZK-specific headers for preview
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=1800',
            'Content-Disposition': `inline; filename="${fileDoc.originalName}"`,
            'X-ZK-Encrypted': 'true',
            'X-ZK-Algorithm': fileDoc.zkMetadata?.algorithm || 'unknown',
            'X-ZK-IV': fileDoc.zkMetadata?.iv || '',
            'X-ZK-Salt': fileDoc.zkMetadata?.salt || '',
            'X-ZK-Iterations': fileDoc.zkMetadata?.iterations?.toString() || '0',
            'X-ZK-Key-Hint': fileDoc.zkMetadata?.keyHint || 'unknown',
          },
        });
      }

      // For unencrypted files, read normally
      fileBuffer = await readFile(filePath);

      // Log successful preview (NOT download)
      await saveSecurityEvent({
        type: 'file_preview',
        ip: clientIP,
        details: `File previewed: ${fileDoc.originalName}`,
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
          'Content-Length': fileDoc.size.toString(),
          'Cache-Control': 'public, max-age=1800',
          'Content-Disposition': `inline; filename="${fileDoc.originalName}"`,
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