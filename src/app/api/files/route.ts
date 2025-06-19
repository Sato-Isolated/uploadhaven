import {
  withAPI,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware';
import { File, User } from '@/lib/database/models';

/**
 * GET /api/files
 * 
 * Get a list of all non-deleted files with user information.
 * Supports query parameters for admin interface.
 * 
 * Query params:
 * - limit: number of files to return (default: 50, max: 500)
 * - sort: field to sort by (uploadDate, size, downloadCount)
 * - order: asc or desc (default: desc) * - userId: filter by specific user
 */
export const GET = withAPI(async (request) => {  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
    const sort = url.searchParams.get('sort') || 'uploadDate';
    const order = url.searchParams.get('order') || 'desc';
    const userId = url.searchParams.get('userId');

    // Build query filter
    const filter: any = { isDeleted: false };
    if (userId) filter.userId = userId;
    
    // Build sort object
    const sortObj: any = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Get filtered files
    const files = await File.find(filter)
      .sort(sortObj)
      .limit(limit)
      .lean();

    // Get unique user IDs from files that have userId
    const userIds = [
      ...new Set(files.map((file) => file.userId).filter(Boolean)),
    ];

    // Fetch user data for all user IDs
    const users = await User.find(
      { _id: { $in: userIds } },
      { name: 1, email: 1 }
    ).lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));    const fileList = files.map((file) => {
      const user = file.userId ? userMap.get(file.userId) : null;
      // Type assertion for new security fields (added via migration)
      const fileWithSecurity = file as any;      return {
        id: file._id.toString(),
        name: file.filename,
        originalName: file.originalName,
        originalType: file.mimeType, // Use mimeType as originalType for now
        size: file.size,
        uploadDate: file.uploadDate.toISOString(),
        expiresAt: file.expiresAt ? file.expiresAt.toISOString() : null,
        mimeType: file.mimeType,
        downloadCount: file.downloadCount || 0,
        type: getFileType(file.mimeType),
        shortUrl: file.shortUrl || file._id.toString(), // Use shortUrl if available, fallback to ID
        isZeroKnowledge: fileWithSecurity.isZeroKnowledge || false,
        zkMetadata: fileWithSecurity.zkMetadata || undefined,
        userId: file.userId || null,
        userName: user ? user.name : null,
        isAnonymous: file.isAnonymous !== false, // Default to true if not explicitly false
        isPasswordProtected: file.isPasswordProtected || false,
        ipHash: fileWithSecurity.ipHash || null,
        downloadLimit: fileWithSecurity.downloadLimit || null,
      };    });

    return createSuccessResponse({ files: fileList });
  } catch (error) {
    console.error('Error fetching files:', error);
    return createErrorResponse('Failed to fetch files', 'FILES_FETCH_ERROR', 500);
  }
});

function getFileType(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  )
    return 'document';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('archive')
  )
    return 'archive';
  return 'other';
}
