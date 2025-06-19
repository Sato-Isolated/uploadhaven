import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/database/mongodb';
import { User, File } from '@/lib/database/models';

/**
 * POST /api/admin/stats/refresh
 * Refresh system statistics (Zero Knowledge compliant)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Add proper admin role check

    await connectDB();

    // Recalculate all statistics
    const [
      totalUsers,
      totalFiles,
      totalStorageResult,
      todayUploadsResult,
      totalDownloadsResult,
    ] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      File.aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' }
          }
        }
      ]),
      File.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      File.aggregate([
        {
          $group: {
            _id: null,
            totalDownloads: { $sum: '$downloadCount' }
          }
        }
      ])
    ]);

    const totalStorage = totalStorageResult[0]?.totalSize || 0;
    const todayUploads = todayUploadsResult;
    const totalDownloads = totalDownloadsResult[0]?.totalDownloads || 0;

    // Calculate additional metrics
    const activeUsers = await User.countDocuments({
      isActive: true
    });

    const newUsersToday = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const refreshedStats = {
      totalUsers,
      activeUsers,
      newUsersToday,
      totalFiles,
      totalStorage,
      todayUploads,
      totalDownloads,
      lastRefreshed: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Statistics refreshed successfully',
      stats: refreshedStats
    });

  } catch (error) {
    console.error('Stats refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh statistics' },
      { status: 500 }
    );
  }
}
