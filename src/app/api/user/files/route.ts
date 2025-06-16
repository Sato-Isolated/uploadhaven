import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/database/mongodb';
import { File, User } from '@/lib/database/models';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    } // Connect to MongoDB
    await connectDB(); // Update lastActivity for navigation tracking
    try {
      console.log(
        '🔍 FILES ROUTE: Attempting to update lastActivity for user:',
        session.user.id
      );
      const updateResult = await User.findByIdAndUpdate(
        session.user.id,
        {
          lastActivity: new Date(),
        },
        { new: true }
      );
      console.log(
        '🔍 FILES ROUTE: Update result:',
        updateResult ? 'Success' : 'Failed'
      );
      if (updateResult) {
        console.log(
          '🔍 FILES ROUTE: New lastActivity:',
          updateResult.lastActivity
        );
      }
    } catch (error) {
      console.error('❌ FILES ROUTE: Failed to update lastActivity:', error);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'uploadDate';
    const order = searchParams.get('order') || 'desc';

    // Calculate skip value for pagination
    const skip = (page - 1) * limit; // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Fetch user's files
    const files = await File.find({ userId: session.user.id })
      .sort(sortObj)
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalCount = await File.countDocuments({ userId: session.user.id });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        uploadDate: file.uploadDate,
        expiresAt: file.expiresAt,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/${file.filename}`,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalCount,
        totalPages,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error fetching user files:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
