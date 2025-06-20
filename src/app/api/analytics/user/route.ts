import { NextRequest } from 'next/server';
import { withAuthenticatedAPI, createSuccessResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File } from '@/lib/database/models';
import { AuditLog } from '@/lib/database/audit-models';

export const GET = withAuthenticatedAPI(async (request: AuthenticatedRequest) => {
  const url = new URL((request as unknown as NextRequest).url);
  const timeRange = url.searchParams.get('timeRange') || '7d';
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const userId = request.user.id;

  // Calculate date range
  const now = new Date();
  const startDate = new Date();

    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    } // Get user's files for filtering downloads
    const userFiles = await File.find({ userId }).select('originalName');
    const userOriginalNames = userFiles.map((file) => file.originalName);    // Get downloads for user's files only from audit logs
    const downloadEvents = await AuditLog.find({
      category: 'file_operation',
      action: { $regex: 'download', $options: 'i' },
      timestamp: { $gte: startDate },
      'metadata.filename': { $in: userOriginalNames }, // Filter by user's files using originalName
    }).sort({ timestamp: -1 });

    const totalDownloads = downloadEvents.length; // Get top files by download count (user's files only)
    const topFiles = await File.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
          downloadCount: { $gt: 0 },
        },
      },
      {
        $sort: { downloadCount: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          filename: 1,
          originalName: 1,
          downloadCount: 1,
          size: 1,
          mimeType: 1,
          uploadDate: 1,
          shortUrl: 1,
        },
      },
    ]);

    // Transform topFiles to match expected format
    const transformedTopFiles = topFiles.map((file) => ({
      ...file,
      type: file.mimeType, // Add type field expected by components
      uploadDate: file.uploadDate.toISOString(), // Ensure date is string
    }));    // Get download trends (daily aggregation) for user's files
    const downloadTrends = await AuditLog.aggregate([
      {
        $match: {
          category: 'file_operation',
          action: { $regex: 'download', $options: 'i' },
          timestamp: { $gte: startDate },
          'metadata.filename': { $in: userOriginalNames },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]); // Fill in missing dates with 0 downloads (most recent first)
    const trends = [];
    const currentDate = new Date(now);
    while (currentDate >= startDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = downloadTrends.find((trend: any) => trend._id === dateStr);
      trends.push({
        date: dateStr,
        downloads: existing ? existing.count : 0,
      });
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Get file type distribution for user's files
    const fileTypeStats = await File.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
          downloadCount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $regexMatch: { input: '$mimeType', regex: '^image/' } },
              then: 'Image',
              else: {
                $cond: {
                  if: { $regexMatch: { input: '$mimeType', regex: '^video/' } },
                  then: 'Video',
                  else: {
                    $cond: {
                      if: {
                        $regexMatch: { input: '$mimeType', regex: '^audio/' },
                      },
                      then: 'Audio',
                      else: {
                        $cond: {
                          if: {
                            $regexMatch: {
                              input: '$mimeType',
                              regex: '^text/',
                            },
                          },
                          then: 'Text',
                          else: {
                            $cond: {
                              if: {
                                $regexMatch: {
                                  input: '$mimeType',
                                  regex: 'pdf',
                                },
                              },
                              then: 'PDF',
                              else: 'Other',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
        },
      },
      {
        $sort: { totalDownloads: -1 },
      },
    ]);    // Get recent downloads for user's files with file info
    const recentDownloads = await AuditLog.aggregate([
      {
        $match: {
          category: 'file_operation',
          action: { $regex: 'download', $options: 'i' },
          timestamp: { $gte: startDate },
          'metadata.filename': { $in: userOriginalNames },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $limit: 20,
      },
      {
        $lookup: {
          from: 'files',
          localField: 'filename',
          foreignField: 'originalName',
          as: 'fileInfo',
        },
      },
      {
        $unwind: { path: '$fileInfo', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          timestamp: 1,
          ip: 1,
          filename: 1,
          fileSize: 1,
          fileType: 1,
          originalName: { $ifNull: ['$fileInfo.originalName', 'Unknown'] },
          shortUrl: { $ifNull: ['$fileInfo.shortUrl', null] },
        },
      },
    ]);

    // Calculate average downloads per day
    const daysDiff = Math.max(
      1,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgDownloadsPerDay = Math.round(totalDownloads / daysDiff);    // Get unique downloaders (by ipHash) for user's files
    const uniqueDownloaders = await AuditLog.distinct('ipHash', {
      category: 'file_operation',
      action: { $regex: 'download', $options: 'i' },
      timestamp: { $gte: startDate },
      'metadata.filename': { $in: userOriginalNames },
    });// Get user's total files count
    const userTotalFiles = await File.countDocuments({ userId });
    
    return createSuccessResponse({
      analytics: {
        totalDownloads,
        last24hDownloads: downloadEvents.filter((event: any) => {
          const eventDate = new Date(event.timestamp);
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return eventDate >= yesterday;
        }).length,
        last7dDownloads: totalDownloads,
        avgDownloadsPerDay,
        uniqueDownloaders: uniqueDownloaders.length,
        totalFiles: userTotalFiles,
        timeRange,
        topFiles: transformedTopFiles,
        downloadTrends: trends,
        fileTypeStats,
        recentDownloads,
      },
    });
  });
