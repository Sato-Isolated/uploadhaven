// Using proper DDD architecture - no legacy imports
import { createSuccessResponse, createErrorResponse } from '@/shared/infrastructure/api/responses';
import { withAdminAPI, AuthenticatedRequest } from '@/shared/infrastructure/middleware/auth';
import { AdminService } from '@/shared/infrastructure/di/dependency-container';

/**
 * GET /api/admin/users
 *
 * Admin users management endpoint (DDD Architecture).
 * Retrieves all users with statistics and activity data.
 * 
 * @architecture DDD - Uses admin domain and cross-domain aggregation
 * @auth Admin-only - Requires admin role authentication
 * @privacy Privacy-aware - Returns aggregated data only
 */
async function getUsersHandler(request: AuthenticatedRequest) {
  console.log('🔐 Admin users API called by:', {
    userId: request.user.userId?.slice(-8),
    emailHash: request.user.emailHash?.slice(-8) + '...',
    isEmailVerified: request.user.isEmailVerified,
    isActive: request.user.isActive
  });
  try {
    // Use Domain Service through Service Layer for admin operations
    // TODO: Implement getAllUsersWithStats in AdminService
    const usersData = {
      users: [], // Placeholder - implement in AdminService
      summary: {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0
      }
    };

    console.log('📊 Admin users data retrieved:', {
      totalUsers: usersData.users.length,
      activeUsers: usersData.summary.activeUsers,
      verifiedUsers: usersData.summary.verifiedUsers
    });

    // Log admin action through Domain Service
    await AdminService.logAdminAction(
      request.user.userId,
      'view_users',
      `Admin viewed users list (${usersData.users.length} users)`
    );

    return createSuccessResponse({
      users: usersData.users,
      summary: usersData.summary
    });

  } catch (error) {
    console.error('❌ Error in admin users handler:', error);    // Log admin error through Domain Service  
    await AdminService.logAdminAction(
      request.user.userId,
      'view_users_failed',
      `Admin users view failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return createErrorResponse(
      'Failed to retrieve users data',
      'ADMIN_USERS_FAILED',
      500
    );
  }
}

/**
 * Export with admin authentication middleware
 */
export const GET = withAdminAPI(getUsersHandler);
