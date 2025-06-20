import { withAuthenticatedAPI, createSuccessResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File } from '@/lib/database/models';

export const GET = withAuthenticatedAPI(async ({ user }: AuthenticatedRequest) => {
  const userId = user.id;

  // Get basic file statistics
  const totalFiles = await File.countDocuments({ userId });
  const totalSize = await File.aggregate([
    { $match: { userId } },
    { $group: { _id: null, totalSize: { $sum: '$size' } } },
  ]);

  // Get password protection stats
  const passwordStats = await File.aggregate([
    { $match: { userId } },
    { $group: { _id: '$isPasswordProtected', count: { $sum: 1 } } },
  ]);

  // Get files by type (based on mimeType)
  const typeStats = await File.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              {
                case: {
                  $regexMatch: { input: '$mimeType', regex: /^image\// },
                },
                then: 'image',
              },
              {
                case: {
                  $regexMatch: { input: '$mimeType', regex: /^video\// },
                },
                then: 'video',
              },
              {
                case: {
                  $regexMatch: { input: '$mimeType', regex: /^audio\// },
                },
                then: 'audio',
              },
              {
                case: {
                  $regexMatch: { input: '$mimeType', regex: /^text\// },
                },
                then: 'text',
              },
              {
                case: { $eq: ['$mimeType', 'application/pdf'] },
                then: 'document',
              },
              {
                case: {
                  $regexMatch: { input: '$mimeType', regex: /zip|archive/ },
                },
                then: 'archive',
              },
            ],
            default: 'other',
          },
        },
        count: { $sum: 1 },
        size: { $sum: '$size' },
      },
    },
  ]);

  // Get recent uploads (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUploads = await File.countDocuments({
    userId,
    uploadDate: { $gte: sevenDaysAgo },
  });

  // Get files expiring soon (next 24 hours)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiringSoon = await File.countDocuments({
    userId,
    expiresAt: { $lte: tomorrow, $gt: new Date() },
  });

  return createSuccessResponse({
    stats: {
      totalFiles,
      totalSize: totalSize[0]?.totalSize || 0,
      recentUploads,
      expiringSoon,
      passwordProtection: passwordStats.reduce(
        (acc, stat) => {
          acc[stat._id ? 'protected' : 'unprotected'] = stat.count;
          return acc;
        },
        { protected: 0, unprotected: 0 } as Record<string, number>
      ),
      fileTypes: typeStats.map((stat) => ({
        type: stat._id,
        count: stat.count,
        size: stat.size,
      })),
    },
  });
});
