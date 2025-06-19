import { createSuccessResponse, withAdminAPI } from '@/lib/middleware';
import { User, File } from '@/lib/database/models';
import type { AuthenticatedRequest } from '@/lib/middleware/auth';

async function getUsersHandler(request: AuthenticatedRequest) {
  console.log('🔐 Admin users API called by:', {
    userId: request.user.id,
    email: request.user.email,
    role: request.user.role,
    name: request.user.name,
    emailVerified: request.user.emailVerified
  });

  try {
    // First, let's test a simple User query
    const userCount = await User.countDocuments();
    console.log('📊 Total users in database:', userCount);    // Fetch all users with basic info
    const usersFromDB = await User.find(
      {},
      {
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        emailVerified: 1,
        lastActivity: 1,
        isActive: 1, // Include the isActive field from database
      }
    ).sort({ createdAt: -1 });

    console.log('📋 Raw users from DB:', usersFromDB.length, 'users found');

    // Calculate storage used and file count for all users using aggregation
    const userStats = await File.aggregate([
      {
        $match: {
          isDeleted: false,
          userId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$userId',
          storageUsed: { $sum: '$size' },
          fileCount: { $sum: 1 },
        },
      },
    ]);

    console.log('📊 User stats from files:', userStats.length, 'users with files');

    // Create a map for quick lookup of user stats
    const userStatsMap = new Map(
      userStats.map((stat) => [
        stat._id,
        { storageUsed: stat.storageUsed, fileCount: stat.fileCount },
      ])
    );    // Transform _id to id for frontend compatibility
    const users = usersFromDB.map((user) => {
      // Get actual stats for this user or default to 0
      const stats = userStatsMap.get(user._id.toString()) || {
        storageUsed: 0,
        fileCount: 0,
      };      // Type assertion for isActive field (added via migration)
      const userWithActive = user as any;
      const isActiveValue = userWithActive.isActive !== undefined ? userWithActive.isActive : true;
      
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.emailVerified,
        isActive: isActiveValue,
        createdAt: user.createdAt.toISOString(),
        lastActiveAt: user.lastActivity
          ? user.lastActivity.toISOString()
          : user.createdAt.toISOString(),
        storageUsed: stats.storageUsed,
        fileCount: stats.fileCount,
      };
    });

    console.log('✅ Returning', users.length, 'processed users');
    return createSuccessResponse({ users });

  } catch (error) {
    console.error('❌ Error in getUsersHandler:', error);
    throw error;
  }
}

export const GET = withAdminAPI(getUsersHandler);
