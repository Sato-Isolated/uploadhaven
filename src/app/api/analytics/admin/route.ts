import { NextRequest } from 'next/server';
import { withAdminAPI, createSuccessResponse, createErrorResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File, User } from '@/lib/database/models';

async function getAdminAnalyticsHandler(request: AuthenticatedRequest) {
  try {

    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '30d';

    // Calculate date ranges
    const now = new Date();
    const startDate = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (timeRange) {
      case '7d':
        startDate.setTime(last7d.getTime());
        break;
      case '30d':
        startDate.setTime(last30d.getTime());
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setTime(last30d.getTime());
    }

    // System Overview Metrics
    const [
      totalFiles,
      totalUsers,
      totalSize,
      totalDownloads,
      filesLast24h,
      filesLast7d,
      usersLast24h,
      usersLast7d,
      activeUsers,
    ] = await Promise.all([
      File.countDocuments({ isDeleted: false }),
      User.countDocuments(),
      File.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } },
      ]).then((result) => result[0]?.totalSize || 0),
      File.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } },
      ]).then((result) => result[0]?.totalDownloads || 0),
      File.countDocuments({ uploadDate: { $gte: last24h }, isDeleted: false }),
      File.countDocuments({ uploadDate: { $gte: last7d }, isDeleted: false }),
      User.countDocuments({ createdAt: { $gte: last24h } }),
      User.countDocuments({ createdAt: { $gte: last7d } }),
      User.countDocuments({ lastActivity: { $gte: last7d } }),
    ]);

    // File Analytics - Upload trends over time
    const uploadTrends = await File.aggregate([
      {
        $match: {
          isDeleted: false,
          uploadDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$uploadDate',
            },
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // File Type Distribution
    const fileTypeDistribution = await File.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$mimeType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // User Analytics - User growth trends
    const userGrowthTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);    // Security Analytics (simplified without SecurityEvent model)
    const securityEvents: { _id: string; count: number }[] = [];
    const recentSecurityEvents: any[] = [];

    // Top Files by Downloads
    const topFiles = await File.find({
      isDeleted: false,
      downloadCount: { $gt: 0 },
    })
      .sort({ downloadCount: -1 })
      .limit(10)
      .select('filename originalName downloadCount size mimeType uploadDate'); // Storage Analytics with user names
    const storageByUser = await File.aggregate([
      {
        $match: { isDeleted: false, userId: { $exists: true } },
      },
      {
        $group: {
          _id: '$userId',
          totalSize: { $sum: '$size' },
          fileCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalSize: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $addFields: {
          userName: {
            $ifNull: [
              { $arrayElemAt: ['$userInfo.name', 0] },
              { $arrayElemAt: ['$userInfo.email', 0] },
            ],
          },
        },
      },
    ]);

    // Format size utility
    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }; // Fill in missing dates for trends
    const fillTrendGaps = (
      trends: { _id: string; count?: number; totalSize?: number }[],
      startDate: Date,
      endDate: Date
    ) => {
      const filledTrends = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const existing = trends.find((trend) => trend._id === dateStr);
        filledTrends.push({
          date: dateStr,
          count: existing?.count || 0,
          totalSize: existing?.totalSize || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return filledTrends;
    };

    const analytics = {
      success: true,
      timeRange,
      systemOverview: {
        totalFiles,
        totalUsers,
        totalStorage: formatSize(totalSize),
        totalStorageBytes: totalSize,
        totalDownloads,
        filesLast24h,
        filesLast7d,
        usersLast24h,
        usersLast7d,
        activeUsers,
        // Calculate growth percentages
        fileGrowth:
          filesLast7d > 0
            ? Math.round(((filesLast24h * 7) / filesLast7d - 1) * 100)
            : 0,
        userGrowth:
          usersLast7d > 0
            ? Math.round(((usersLast24h * 7) / usersLast7d - 1) * 100)
            : 0,
      },
      fileAnalytics: {
        uploadTrends: fillTrendGaps(uploadTrends, startDate, now),
        fileTypeDistribution: fileTypeDistribution.map((type) => ({
          type: type._id,
          count: type.count,
          size: formatSize(type.totalSize),
          sizeBytes: type.totalSize,
        })),
        topFiles: topFiles.map((file) => ({
          filename: file.filename,
          originalName: file.originalName,
          downloadCount: file.downloadCount,
          size: formatSize(file.size),
          sizeBytes: file.size,
          mimeType: file.mimeType,
          uploadDate: file.uploadDate,
        })),
      },
      userAnalytics: {
        growthTrends: fillTrendGaps(userGrowthTrends, startDate, now),
        storageByUser: storageByUser.map((user) => ({
          userId: user._id,
          userName: user.userName || `User ${user._id.toString().slice(-8)}`,
          totalSize: formatSize(user.totalSize),
          totalSizeBytes: user.totalSize,
          fileCount: user.fileCount,
        })),
      },      securityAnalytics: {
        eventsByType: securityEvents,
        recentEvents: recentSecurityEvents,
        totalEvents: securityEvents.reduce(
          (sum: number, event: { count: number }) => sum + event.count,
          0
        ),
      },
    };

    return createSuccessResponse(analytics);
  } catch (error) {
    console.error('Admin analytics API error:', error);
    return createErrorResponse('Failed to fetch admin analytics', 'INTERNAL_ERROR');
  }
}

export const GET = withAdminAPI(getAdminAnalyticsHandler);
