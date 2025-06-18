import { NextRequest } from 'next/server';
import { withAPI, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { File, SecurityEvent } from '@/lib/database/models';

export const GET = withAPI(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '7d';
    const limit = parseInt(url.searchParams.get('limit') || '10');

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
    }

    // Get total downloads in time range
    const downloadEvents = await SecurityEvent.find({
      type: 'file_download',
      timestamp: { $gte: startDate },
      details: { $regex: /File downloaded:/ },
    }).sort({ timestamp: -1 });

    const totalDownloads = downloadEvents.length;

    // Get top files by download count
    const topFiles = await File.aggregate([
      {
        $match: {
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

    // Get download trends (daily aggregation)
    const downloadTrends = await SecurityEvent.aggregate([
      {
        $match: {
          type: 'file_download',
          timestamp: { $gte: startDate },
          details: { $regex: /File downloaded:/ },
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
        $sort: { _id: 1 },
      },
    ]);

    // Fill in missing dates with 0 downloads
    const trends = [];
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = downloadTrends.find((trend) => trend._id === dateStr);
      trends.push({
        date: dateStr,
        downloads: existing ? existing.count : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get file type distribution
    const fileTypeStats = await File.aggregate([
      {
        $match: {
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
    ]);

    // Get recent downloads with file info
    const recentDownloads = await SecurityEvent.aggregate([
      {
        $match: {
          type: 'file_download',
          timestamp: { $gte: startDate },
          details: { $regex: /File downloaded:/ },
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
          foreignField: 'filename',
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
    const avgDownloadsPerDay = Math.round(totalDownloads / daysDiff);

    // Get unique downloaders (by IP)
    const uniqueDownloaders = await SecurityEvent.distinct('ip', {
      type: 'file_download',
      timestamp: { $gte: startDate },
      details: { $regex: /File downloaded:/ },
    });    return createSuccessResponse({
      overview: {
        totalDownloads,
        avgDownloadsPerDay,
        uniqueDownloaders: uniqueDownloaders.length,
        timeRange,
      },
      topFiles,
      downloadTrends: trends,
      fileTypeStats,
      recentDownloads,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return createErrorResponse(
      'Failed to fetch analytics data',
      'ANALYTICS_FETCH_FAILED',
      500
    );
  }
});
