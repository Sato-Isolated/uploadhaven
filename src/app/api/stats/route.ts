import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { File, User, getSecurityStats, getRecentSecurityEvents } from '@/lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get URL search params
    const { searchParams } = new URL(request.url)
    const includeEvents = searchParams.get('includeEvents') === 'true'    // Calculate file statistics
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalFiles,
      totalSize,
      last24hUploads,
      last7dUploads,
      totalDownloads,
      totalUsers,
      activeUsersLast7d,
      activeUsersLast24h,
      securityStats,
      recentEvents
    ] = await Promise.all([
      File.countDocuments({ isDeleted: false }),
      File.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]).then(result => result[0]?.totalSize || 0),
      File.countDocuments({ 
        uploadDate: { $gte: last24h },
        isDeleted: false 
      }),
      File.countDocuments({ 
        uploadDate: { $gte: last7d },
        isDeleted: false 
      }),
      File.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
      ]).then(result => result[0]?.totalDownloads || 0),
      User.countDocuments({}),
      User.countDocuments({ 
        lastActivity: { $gte: last7d }
      }),
      User.countDocuments({ 
        lastActivity: { $gte: last24h }
      }),
      getSecurityStats(),
      includeEvents ? getRecentSecurityEvents(20) : null
    ])

    // Calculate file type distribution
    const fileTypeStats = await File.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$mimeType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])    // Format total size
    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const stats = {
      success: true,
      stats: {
        totalFiles,
        totalSize: formatSize(totalSize),
        totalSizeBytes: totalSize,
        last24hUploads,
        last7dUploads,
        totalDownloads,
        fileTypeDistribution: fileTypeStats
      },
      users: {
        totalUsers,
        activeUsersLast24h,
        activeUsersLast7d
      },
      security: securityStats,
      ...(includeEvents && { recentEvents })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
