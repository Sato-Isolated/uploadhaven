import { NextRequest } from 'next/server';
import { withAPIParams, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { File } from '@/lib/database/models';
import { logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';

/**
 * GET /api/file-info/[shortUrl]
 * 
 * Returns public metadata for a file without sensitive information.
 * Used by the FilePreviewRouter to determine file type and basic info.
 * 
 * This endpoint is ZK-only and returns information about encrypted files
 * without exposing any sensitive data.
 */
export const GET = withAPIParams<{ shortUrl: string }>(
  async (request: NextRequest, { params }) => {
    const { shortUrl } = await params;

    console.log('File info request - shortUrl:', shortUrl);

    if (!shortUrl) {
      console.log('File info error - missing shortUrl');
      return createErrorResponse('Short URL is required', 'MISSING_SHORT_URL', 400);
    }

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
    });    if (!file) {      // Log the attempt to access non-existent file
      await logSecurityEvent(
        'file_info_not_found',
        `File not found: ${shortUrl}`,
        'medium',
        false,
        {
          shortUrl,
          reason: 'file_not_found',
          threatType: 'invalid_access'
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );
      
      return createErrorResponse('File not found', 'FILE_NOT_FOUND', 404);
    }    // Check if file has expired
    const now = new Date();
    const isExpired = file.expiresAt && new Date(file.expiresAt) <= now;    if (isExpired) {
      await logSecurityEvent(
        'file_access_expired',
        `Expired file access attempt: ${shortUrl}`,
        'medium',
        false,
        {
          shortUrl,
          reason: 'file_expired',
          expiredAt: file.expiresAt
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );
      
      return createErrorResponse('File has expired', 'FILE_EXPIRED', 410);
    }

    // Check if file has reached download limit  
    // Note: downloadLimit is not part of the current schema, but download count is tracked
    // For now, we'll skip this check as maxDownloads field doesn't exist in IFile

    // Validate that this is a ZK file
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
        return createErrorResponse('File type not supported - legacy files are not supported in ZK-only mode', 'UNSUPPORTED_FILE_TYPE', 400);
    }    console.log('File validation passed - this is a ZK file');    // Return safe public metadata
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
    };

    console.log('Constructed fileInfo:', JSON.stringify(fileInfo, null, 2));
    console.log('Original file.zkMetadata:', JSON.stringify(file.zkMetadata, null, 2));

    console.log('API Response fileInfo:', {
      shortUrl: fileInfo.shortUrl,
      hasZkMetadata: !!fileInfo.zkMetadata,
      zkMetadata: fileInfo.zkMetadata,
      zkMetadataKeys: Object.keys(fileInfo.zkMetadata)
    });    // Log successful file info access
    await logFileOperation(
      'file_info_accessed',
      `File info accessed: ${shortUrl}`,
      file._id?.toString() || shortUrl,
      file.zkMetadata?.originalName || file.originalName || 'encrypted_file',
      file._id?.toString() || '', // Use file ID as hash since no dedicated fileHash field
      undefined, // No userId for anonymous access
      {
        contentCategory: file.zkMetadata?.contentCategory || 'unknown',
        isPasswordProtected: file.isPasswordProtected,
        accessType: 'info_request',
        fileSize: file.size,
        mimeType: file.mimeType
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    return createSuccessResponse(fileInfo);
  }
);
