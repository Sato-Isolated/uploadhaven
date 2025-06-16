import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { SecurityEvent } from '@/lib/database/models';

// GET /api/admin/activities - Get recent activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // optional filter by activity type
    const severity = searchParams.get('severity'); // optional filter by severity
    const userId = searchParams.get('userId'); // optional filter by user
    const skip = (page - 1) * limit;

    await connectDB();

    // Build filter query
    const filter: Record<string, string> = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (userId) filter.userId = userId;

    // Get recent activities
    const [activities, totalCount] = await Promise.all([
      SecurityEvent.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SecurityEvent.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    return NextResponse.json({
      success: true,
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
}
