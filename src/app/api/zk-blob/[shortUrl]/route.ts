import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import connectDB from '@/lib/database/mongodb';
import { File, saveSecurityEvent } from '@/lib/database/models';

interface ZKBlobParams {
  params: Promise<{
    shortUrl: string;
  }>;
}

/**
 * GET /api/zk-blob/[shortUrl]
 * 
 * Serves the encrypted blob data for ZK files.
 * This endpoint streams the raw encrypted file data to the client
 * for client-side decryption in the preview system.
 * 
 * Security: Only serves encrypted data - no sensitive information is exposed.
 */
export async function GET(
  request: NextRequest,
  { params }: ZKBlobParams
): Promise<NextResponse> {
  try {
    const { shortUrl } = await params;

    if (!shortUrl) {
      return NextResponse.json(
        { success: false, error: 'Short URL is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the file by shortUrl
    const file = await File.findOne({ 
      shortUrl,
      // Only look for files that are not soft-deleted
      deletedAt: { $exists: false }
    }).select({
      // Select fields needed for blob serving
      shortUrl: 1,
      filename: 1,
      expiresAt: 1,
      downloadCount: 1,
      // ZK files only
      isZeroKnowledge: 1,
      zkMetadata: 1,
    });

    if (!file) {
      await saveSecurityEvent({
        type: 'blob_access_denied',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: `ZK blob not found: ${shortUrl}`,
        severity: 'medium',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { shortUrl, reason: 'file_not_found' },
      });

      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file has expired
    const now = new Date();
    const isExpired = file.expiresAt && new Date(file.expiresAt) <= now;

    if (isExpired) {
      await saveSecurityEvent({
        type: 'blob_access_denied',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: `Expired ZK blob access attempt: ${shortUrl}`,
        severity: 'medium',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { shortUrl, reason: 'file_expired', expiredAt: file.expiresAt },
      });

      return NextResponse.json(
        { success: false, error: 'File has expired' },
        { status: 410 } // Gone
      );
    }

    // Validate that this is a ZK file
    if (!file.isZeroKnowledge || !file.zkMetadata) {
      return NextResponse.json(
        { success: false, error: 'File type not supported' },
        { status: 400 }
      );
    }    // Construct file path - ZK files are stored in public/uploads/public
    // Handle both cases: filename with or without public/ prefix
    const uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), 'public', 'uploads');
    const filename = file.filename.startsWith('public/') ? file.filename.substring(7) : file.filename;
    const filePath = join(uploadsDir, 'public', filename);

    // Check if file exists on disk
    let fileBuffer: Buffer;
    try {
      fileBuffer = readFileSync(filePath);
    } catch (error) {
      console.error('Failed to read encrypted file:', error);
        await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: `ZK blob file missing on disk: ${shortUrl}`,
        severity: 'high',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { 
          shortUrl, 
          filename: file.filename,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
      });

      return NextResponse.json(
        { success: false, error: 'File not available' },
        { status: 404 }
      );
    }

    // Increment download count
    await File.updateOne(
      { _id: file._id },
      { $inc: { downloadCount: 1 } }
    );    // Log successful blob access
    await saveSecurityEvent({
      type: 'file_download',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      details: `ZK blob accessed: ${shortUrl}`,
      severity: 'low',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        shortUrl,
        contentCategory: file.zkMetadata.contentCategory,
        encryptedSize: file.zkMetadata.encryptedSize,
      },
    });

    // Return the encrypted blob data
    // The client will decrypt this data using the ZK system
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // CORS headers for browser access
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error serving ZK blob:', error);    await saveSecurityEvent({
      type: 'suspicious_activity',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      details: `Error serving ZK blob: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'high',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        shortUrl: (await params).shortUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
