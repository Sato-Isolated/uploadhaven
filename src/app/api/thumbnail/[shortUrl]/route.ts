import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { File, saveSecurityEvent } from '@/lib/database/models';
import { checkFileExpiration } from '@/lib/background/startup';
import path from 'path';
import { readFile } from 'fs/promises';
import {
  generateEncryptedThumbnail,
  decryptThumbnail,
  thumbnailCache,
} from '@/lib/encryption/thumbnail-encryption';
import type { IFile } from '@/types/database';
import { readAndDecryptFile } from '@/lib/encryption/file-decryption';

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
    }

    // Only generate thumbnails for supported file types
    const mimeType = fileDoc.mimeType;
    if (!isThumbnailSupported(mimeType)) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail not supported for this file type' },
        { status: 400 }
      );
    } // Password protection check - thumbnails require same access as preview
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
        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    try {
      // Check cache first
      const cachedThumbnail = await thumbnailCache.retrieve(
        fileDoc._id.toString(),
        fileDoc.shortUrl
      );

      let thumbnailBuffer: Buffer;

      if (cachedThumbnail) {
        console.log('📦 Using cached encrypted thumbnail');
        // Decrypt the cached thumbnail
        thumbnailBuffer = await decryptThumbnail(
          cachedThumbnail.thumbnailBuffer,
          cachedThumbnail.metadata
        );
      } else {
        console.log('🔄 Generating new encrypted thumbnail');
        // Generate new thumbnail
        const filePath = path.join(
          process.cwd(),
          process.env.NODE_ENV === 'production'
            ? '/var/data/uploads'
            : 'public/uploads',
          fileDoc.filename
        );

        const sourceBuffer = fileDoc.isEncrypted
          ? await readAndDecryptFile(filePath, fileDoc as IFile)
          : await readFile(filePath);

        const thumbnailResult = await generateEncryptedThumbnail(
          fileDoc as IFile,
          sourceBuffer,
          fileDoc.mimeType
        );

        // Cache the encrypted thumbnail
        await thumbnailCache.store(
          fileDoc._id.toString(),
          fileDoc.shortUrl,
          thumbnailResult.thumbnailBuffer,
          thumbnailResult.metadata
        );

        // Decrypt for serving
        thumbnailBuffer = await decryptThumbnail(
          thumbnailResult.thumbnailBuffer,
          thumbnailResult.metadata
        );
      }

      // Log successful thumbnail request
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `Encrypted thumbnail served for: ${fileDoc.originalName}`,
        severity: 'low',
        userAgent,
        filename: fileDoc.filename,
        fileSize: fileDoc.size,
        fileType: fileDoc.mimeType,
      });

      // Return thumbnail with appropriate headers
      return new NextResponse(thumbnailBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Disposition': `inline; filename="thumb_${fileDoc.filename}.webp"`,
        },
      });
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate thumbnail' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Thumbnail API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check if file type supports thumbnail generation
function isThumbnailSupported(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf'
  );
}
