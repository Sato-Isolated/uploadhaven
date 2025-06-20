import { NextRequest } from 'next/server';
import {
  withAdminAPI,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware';
import { AuditLog } from '@/lib/database/audit-models';

/**
 * GET /api/admin/activities
 * 
 * Get recent activities and security events for admin dashboard.
 * Requires admin authentication.
 * Supports pagination and filtering by type, severity, and user.
 */
export const GET = withAdminAPI(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const type = searchParams.get('type'); // optional filter by activity type
  const severity = searchParams.get('severity'); // optional filter by severity
  const userId = searchParams.get('userId'); // optional filter by user
  const skip = (page - 1) * limit;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return createErrorResponse('Invalid pagination parameters', 'INVALID_PAGINATION', 400);
  }
  // Build filter query for new audit log structure
  const filter: Record<string, any> = {};
  if (type) filter.action = { $regex: type, $options: 'i' }; // Search in action field
  if (severity) filter.severity = severity;
  if (userId) filter.userId = userId;

  try {
    // Get recent activities from audit logs
    const [activities, totalCount] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return createSuccessResponse({
      activities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalCount,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return createErrorResponse('Failed to fetch recent activities', 'ACTIVITIES_FETCH_ERROR', 500);
  }
});
