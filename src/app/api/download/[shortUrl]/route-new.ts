import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import connectDB from '@/lib/database/mongodb';
import {
  File,
  incrementDownloadCount,
  saveSecurityEvent,
  saveNotification,
} from '@/lib/database/models';
import { checkFileExpiration } from '@/lib/background/startup';
import {
  readAndDecryptFile,
  getContentLength,
  logDecryptionActivity,
} from '@/lib/encryption/file-decryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortUrl: string }> }
) {
  try {
    await connectDB();

    const { shortUrl } = await params;

    // Get client IP and user agent for logging
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Find file by short URL
    const fileDoc = await File.findOne({
      shortUrl,
      isDeleted: false,
    });

    if (!fileDoc) {
      // Log file not found event
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `Download attempted for non-existent short URL: ${shortUrl}`,
        severity: 'medium',
        userAgent,
      });

      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      // Instantly delete the expired file
      await checkFileExpiration(fileDoc._id.toString());

      // Log expired file download attempt
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `Download attempted for expired file: ${fileDoc.filename} (auto-deleted)`,
        severity: 'low',
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: 'File has expired' },
        { status: 410 }
      );
    }

    // Also check for instant expiration (files that just expired)
    const wasDeleted = await checkFileExpiration(fileDoc._id.toString());
    if (wasDeleted) {
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `Download attempted for just-expired file: ${fileDoc.filename} (auto-deleted)`,
        severity: 'low',
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: 'File has expired' },
        { status: 410 }
      );
    }

    // Check if file is password protected
    if (fileDoc.isPasswordProtected) {
      // For password-protected files, they should have been verified through the page
      // Check for verification token or session
      const url = new URL(request.url);
      const verified = url.searchParams.get('verified');

      if (!verified) {
        // Log unauthorized download attempt
        await saveSecurityEvent({
          type: 'unauthorized_access',
          ip: clientIP,
          details: `Direct download attempt for password-protected file: ${fileDoc.filename}`,
          severity: 'high',
          userAgent,
          filename: fileDoc.filename,
        });

        return NextResponse.json(
          { success: false, error: 'Password verification required' },
          { status: 403 }
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
      let fileBuffer: Buffer;

      // Handle Zero-Knowledge files differently
      if (fileDoc.isZeroKnowledge) {
        // For ZK files, serve the encrypted blob as-is
        // Client will handle decryption using keys from URL or password
        const fs = await import('fs/promises');
        fileBuffer = await fs.readFile(filePath);

        console.log('🔐 Serving Zero-Knowledge encrypted blob');
        console.log(`   File: ${fileDoc.filename}`);
        console.log(`   Size: ${fileBuffer.length} bytes`);
        console.log(`   Algorithm: ${fileDoc.zkMetadata?.algorithm}`);

        // Increment download count for ZK files
        await incrementDownloadCount(fileDoc.filename);

        // Log ZK file download
        await saveSecurityEvent({
          type: 'file_download',
          ip: clientIP,
          details: `Zero-Knowledge file downloaded: ${fileDoc.originalName} (encrypted blob)`,
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

        // Create notification for file owner (if not anonymous)
        if (!fileDoc.isAnonymous && fileDoc.userId) {
          try {
            await saveNotification({
              userId: fileDoc.userId,
              type: 'file_downloaded',
              title: 'Zero-Knowledge File Downloaded',
              message: `Your encrypted file "${fileDoc.originalName}" was downloaded`,
              priority: 'normal',
              relatedFileId: fileDoc._id.toString(),
              metadata: {
                downloaderIP: clientIP,
                downloadTime: new Date(),
                fileSize: fileDoc.size,
                mimeType: fileDoc.mimeType,
                wasZeroKnowledge: true,
              },
            });
          } catch (notificationError) {
            console.error(
              'Failed to create ZK download notification:',
              notificationError
            );
          }
        }

        // Return encrypted blob with ZK-specific headers
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream', // Always binary for ZK files
            'Content-Length': fileBuffer.length.toString(),
            'Content-Disposition': `attachment; filename="${fileDoc.originalName}"`,
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'X-ZK-Encrypted': 'true',
            'X-ZK-Algorithm': fileDoc.zkMetadata?.algorithm || 'unknown',
            'X-ZK-IV': fileDoc.zkMetadata?.iv || '',
            'X-ZK-Salt': fileDoc.zkMetadata?.salt || '',
            'X-ZK-Iterations':
              fileDoc.zkMetadata?.iterations?.toString() || '0',
            'X-ZK-Key-Hint': fileDoc.zkMetadata?.keyHint || 'unknown',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
      }

      // For legacy server-side encrypted files, use existing decryption
      fileBuffer = await readAndDecryptFile(filePath, fileDoc);

      // Log decryption activity if file was encrypted (legacy server-side encrypted files)
      logDecryptionActivity(fileDoc, 'download', clientIP, userAgent);

      // Increment download count
      await incrementDownloadCount(fileDoc.filename);

      // Log successful download
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `File downloaded: ${fileDoc.originalName}${fileDoc.isEncrypted ? ' (decrypted)' : ''}`,
        severity: 'low',
        userAgent,
        filename: fileDoc.filename,
        fileSize: fileDoc.size,
        fileType: fileDoc.mimeType,
      });

      // Create notification for file owner (if not anonymous)
      if (!fileDoc.isAnonymous && fileDoc.userId) {
        try {
          await saveNotification({
            userId: fileDoc.userId,
            type: 'file_downloaded',
            title: 'File Downloaded',
            message: `Your file "${fileDoc.originalName}" was downloaded`,
            priority: 'normal',
            relatedFileId: fileDoc._id.toString(),
            metadata: {
              downloaderIP: clientIP,
              downloadTime: new Date(),
              fileSize: fileDoc.size,
              mimeType: fileDoc.mimeType,
              wasEncrypted: fileDoc.isEncrypted || false,
            },
          });
        } catch (notificationError) {
          // Don't fail download if notification fails
          console.error(
            'Failed to create download notification:',
            notificationError
          );
        }
      }

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': fileDoc.mimeType,
          'Content-Length': getContentLength(fileDoc).toString(),
          'Content-Disposition': `attachment; filename="${fileDoc.originalName}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);

      // Log file read error
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `File read error for ${fileDoc.filename}: ${
          fileError instanceof Error ? fileError.message : 'Unknown error'
        }`,
        severity: 'medium',
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: 'File not accessible' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Download API error:', error);

    // Try to log the error
    try {
      const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Download API error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'high',
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
