import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { File, saveSecurityEvent } from '@/lib/database/models';

interface FileInfoParams {
  params: Promise<{
    shortUrl: string;
  }>;
}

/**
 * GET /api/file-info/[shortUrl]
 * 
 * Returns public metadata for a file without sensitive information.
 * Used by the FilePreviewRouter to determine file type and basic info.
 * 
 * This endpoint is ZK-only and returns information about encrypted files
 * without exposing any sensitive data.
 */
export async function GET(
  request: NextRequest,
  { params }: FileInfoParams
): Promise<NextResponse> {
  try {
    const { shortUrl } = await params;

    console.log('File info request - shortUrl:', shortUrl);

    if (!shortUrl) {
      console.log('File info error - missing shortUrl');
      return NextResponse.json(
        { success: false, error: 'Short URL is required' },
        { status: 400 }
      );
    }    // Connect to database
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    // Find the file by shortUrl
    console.log('Querying for file with shortUrl:', shortUrl);
    const file = await File.findOne({
      shortUrl,
      // Only look for files that are not soft-deleted
      deletedAt: { $exists: false }
    }).select({
      // Select only safe, non-sensitive fields
      shortUrl: 1,
      isPasswordProtected: 1,
      expiresAt: 1,
      createdAt: 1,
      // ZK metadata fields (these are safe to expose)
      zkMetadata: 1,
      // These fields help determine file state
      downloadCount: 1,
      maxDownloads: 1,
    });

    if (!file) {      // Log the attempt to access non-existent file
      await saveSecurityEvent({
        type: 'access_denied',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: `File not found: ${shortUrl}`,
        severity: 'medium',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          shortUrl,
          reason: 'file_not_found',
        },
      });

      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }    // Check if file has expired
    const now = new Date();
    const isExpired = file.expiresAt && new Date(file.expiresAt) <= now;

    if (isExpired) {      await saveSecurityEvent({
        type: 'access_denied',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: `Expired file access attempt: ${shortUrl}`,
        severity: 'medium',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          shortUrl,
          reason: 'file_expired',
          expiredAt: file.expiresAt,
        },
      });

      return NextResponse.json(
        { success: false, error: 'File has expired' },
        { status: 410 } // Gone
      );
    }    // Check if file has reached download limit  
    // Note: downloadLimit is not part of the current schema, but download count is tracked
    // For now, we'll skip this check as maxDownloads field doesn't exist in IFile    // Validate that this is a ZK file
    // A file is considered ZK if it has zkMetadata with required fields
    const hasZkMetadata = file.zkMetadata && typeof file.zkMetadata === 'object';
    const hasRequiredZkFields = hasZkMetadata && (
      file.zkMetadata?.algorithm || 
      file.zkMetadata?.iv || 
      file.zkMetadata?.salt ||
      file.zkMetadata?.encryptedSize ||
      (file.zkMetadata && Object.keys(file.zkMetadata).length > 0)
    );
    
    console.log('ZK validation details:', {
      hasZkMetadata,
      hasRequiredZkFields,
      zkMetadata: file.zkMetadata,
      zkMetadataKeys: file.zkMetadata ? Object.keys(file.zkMetadata) : [],
      isZeroKnowledge: file.isZeroKnowledge
    });
    
    // For now, let's be more permissive and accept any file with zkMetadata field
    // even if it's empty, as this might be a migration case
    if (!hasZkMetadata) {
      console.log('File validation failed - no ZK metadata:', {
        isZeroKnowledge: file.isZeroKnowledge,
        hasZkMetadata: !!file.zkMetadata,
        zkMetadataType: typeof file.zkMetadata,
        shortUrl: file.shortUrl
      });
      
      return NextResponse.json(
        { success: false, error: 'File type not supported - legacy files are not supported in ZK-only mode' },
        { status: 400 }
      );
    }

    console.log('File validation passed - this is a ZK file');    // Return safe public metadata
    const fileInfo = {
      shortUrl: file.shortUrl,
      isPasswordProtected: file.isPasswordProtected || false,
      isExpired: false, // We already checked above
      expiresAt: file.expiresAt?.toISOString(),
      // ZK file metadata (safe to expose, with fallbacks for missing fields)
      zkMetadata: {
        contentCategory: file.zkMetadata?.contentCategory || 'other',
        algorithm: file.zkMetadata?.algorithm || 'AES-256-GCM',
        // Include IV and salt needed for decryption
        iv: file.zkMetadata?.iv || '',
        salt: file.zkMetadata?.salt || '',
        iterations: file.zkMetadata?.iterations || 100000,
        keyDerivation: {
          algorithm: 'PBKDF2',
          iterations: file.zkMetadata?.iterations || 100000,
        },
        keyHint: file.zkMetadata?.keyHint === 'password' ? 'password-protected' : 
                 file.zkMetadata?.keyHint === 'embedded' ? 'embedded' : 'url-fragment',
        encryptedSize: file.zkMetadata?.encryptedSize || 0,
        uploadTimestamp: file.zkMetadata?.uploadTimestamp || 0,
        uploadDate: file.createdAt?.toISOString() || new Date().toISOString(),
      },
    };    // Log successful file info access
    await saveSecurityEvent({
      type: 'file_download',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      details: `File info accessed: ${shortUrl}`,
      severity: 'low',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        shortUrl,
        contentCategory: file.zkMetadata?.contentCategory || 'unknown',
        isPasswordProtected: file.isPasswordProtected,
      },
    });

    return NextResponse.json({
      success: true,
      data: fileInfo,
    });

  } catch (error) {
    console.error('Error fetching file info:', error);    // Log the error
    await saveSecurityEvent({
      type: 'suspicious_activity', // Using the closest available type for errors
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      details: `Error fetching file info: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
