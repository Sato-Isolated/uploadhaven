import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/database/mongodb';
import { User, File } from '@/lib/database/models';
import { createSuccessResponse, createErrorResponse, ERROR_CODES } from '@/lib/middleware';
import type { AdminStats } from '@/types/admin';

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    }

    // TODO: Add proper admin role check
    // For now, just check if user is authenticated
    
    await connectDB();
    
    // Get basic stats from database
    const [
      totalUsers,
      totalFiles,
      totalStorageResult,
      todayUploadsResult,
      totalDownloadsResult,
      activeUsersResult,
      newUsersTodayResult
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Total files
      File.countDocuments(),
      
      // Total storage in bytes
      File.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]),
      
      // Today's uploads
      File.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      
      // Total downloads (sum of downloadCount field)
      File.aggregate([
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
      ]),
      
      // Active users (logged in last 7 days)
      User.countDocuments({
        lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // New users today
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);    // Calculate storage
    const totalStorageBytes = totalStorageResult[0]?.totalSize || 0;
    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
    const totalStorage = totalStorageGB > 1 
      ? `${totalStorageGB.toFixed(2)} GB`
      : `${(totalStorageBytes / (1024 * 1024)).toFixed(2)} MB`;

    // Get system uptime (simplified - in real app, this would come from system metrics)
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const uptimeString = uptimeDays > 0 
      ? `${uptimeDays}d ${uptimeHours % 24}h`
      : `${uptimeHours}h ${Math.floor((uptime % 3600) / 60)}m`;

    // Simple health check based on file count and activity
    const systemHealth = totalFiles > 10000 ? 'warning' : 'healthy';

    const stats: AdminStats = {
      totalFiles,
      totalStorage,
      totalStorageBytes,
      todayUploads: todayUploadsResult,
      totalUsers,
      activeUsers: activeUsersResult,
      newUsersToday: newUsersTodayResult,
      totalDownloads: totalDownloadsResult[0]?.totalDownloads || 0,
      systemHealth,
      uptime: uptimeString,
      securityEvents: 0, // TODO: Implement security events tracking
      blockedIPs: 0, // TODO: Implement blocked IPs tracking
      rateLimitHits: 0, // TODO: Implement rate limit tracking
    };

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch admin stats');
  }
}
