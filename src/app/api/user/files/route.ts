import { NextRequest } from 'next/server';
import { withAuthenticatedAPI, createSuccessResponse, type AuthenticatedRequest } from '@/lib/middleware';
import { File, User } from '@/lib/database/models';

export const GET = withAuthenticatedAPI(async (request: AuthenticatedRequest) => {
  const { user } = request;

  // Update lastActivity for navigation tracking
  try {
    console.log('🔍 FILES ROUTE: Attempting to update lastActivity for user:', user.id);
    const updateResult = await User.findByIdAndUpdate(
      user.id,
      { lastActivity: new Date() },
      { new: true }
    );
    console.log('🔍 FILES ROUTE: Update result:', updateResult ? 'Success' : 'Failed');
    if (updateResult) {
      console.log('🔍 FILES ROUTE: New lastActivity:', updateResult.lastActivity);
    }
  } catch (error) {
    console.error('❌ FILES ROUTE: Failed to update lastActivity:', error);
  }

  // Get query parameters
  const url = new URL((request as unknown as NextRequest).url);
  const { searchParams } = url;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const sort = searchParams.get('sort') || 'uploadDate';
  const order = searchParams.get('order') || 'desc';

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;
  
  // Build sort object
  const sortObj: Record<string, 1 | -1> = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  // Fetch user's files
  const files = await File.find({ userId: user.id })
    .sort(sortObj)
    .limit(limit)
    .skip(skip)
    .lean();

  // Get total count for pagination
  const totalCount = await File.countDocuments({ userId: user.id });

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return createSuccessResponse({
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
});
