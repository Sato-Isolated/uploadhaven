import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { File, saveSecurityEvent } from '@/lib/database/models';
import { checkFileExpiration } from '@/lib/background/startup';

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
        details: `File preview requested for non-existent short URL: ${shortUrl}`,
        severity: 'low',
        userAgent,
      });

      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    } // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      // Instantly delete the expired file
      await checkFileExpiration(fileDoc._id.toString());

      // Log expired file access attempt
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `Preview requested for expired file: ${fileDoc.filename} (auto-deleted)`,
        severity: 'low',
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: 'File has expired', expired: true },
        { status: 410 }
      );
    }

    // Also check for instant expiration (files that just expired)
    const wasDeleted = await checkFileExpiration(fileDoc._id.toString());
    if (wasDeleted) {
      await saveSecurityEvent({
        type: 'file_download',
        ip: clientIP,
        details: `Preview requested for just-expired file: ${fileDoc.filename} (auto-deleted)`,
        severity: 'low',
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: 'File has expired', expired: true },
        { status: 410 }
      );
    }    // Check if file is password protected
    if (fileDoc.isPasswordProtected) {
      // Return that password is required
      // For ZK files, try to get original type from zkMetadata
      const originalType = fileDoc.isZeroKnowledge && fileDoc.zkMetadata 
        ? (fileDoc.zkMetadata as { originalType?: string }).originalType || fileDoc.mimeType
        : fileDoc.mimeType;
        
      return NextResponse.json({
        success: true,
        passwordRequired: true,
        fileInfo: {
          originalName: fileDoc.originalName,
          size: fileDoc.size,
          mimeType: fileDoc.mimeType,
          uploadDate: fileDoc.uploadDate,
          isPasswordProtected: true,
          // ZK fields for client-side encryption handling
          isZeroKnowledge: fileDoc.isZeroKnowledge || false,
          originalType: originalType,
          zkMetadata: fileDoc.zkMetadata,
        },
      });
    }

    // Log successful preview request
    await saveSecurityEvent({
      type: 'file_download',
      ip: clientIP,
      details: `File preview requested: ${fileDoc.originalName}`,
      severity: 'low',
      userAgent,
      filename: fileDoc.filename,
      fileSize: fileDoc.size,
      fileType: fileDoc.mimeType,
    });    // Return file information
    // For ZK files, try to get original type from zkMetadata
    const originalType = fileDoc.isZeroKnowledge && fileDoc.zkMetadata 
      ? (fileDoc.zkMetadata as { originalType?: string }).originalType || fileDoc.mimeType
      : fileDoc.mimeType;
      
    return NextResponse.json({
      success: true,
      passwordRequired: false,
      fileInfo: {
        filename: fileDoc.filename,
        originalName: fileDoc.originalName,
        size: fileDoc.size,
        mimeType: fileDoc.mimeType,
        uploadDate: fileDoc.uploadDate,
        expiresAt: fileDoc.expiresAt,
        downloadCount: fileDoc.downloadCount || 0,
        isPasswordProtected: fileDoc.isPasswordProtected || false,
        // ZK fields for client-side encryption handling
        isZeroKnowledge: fileDoc.isZeroKnowledge || false,
        originalType: originalType,
        zkMetadata: fileDoc.zkMetadata,
      },
    });
  } catch (error) {
    console.error('Preview API error:', error);

    // Try to log the error
    try {
      const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Preview API error: ${
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
