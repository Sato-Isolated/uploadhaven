import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { File, User } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();
    // Get all non-deleted files
    const files = await File.find({ isDeleted: false })
      .sort({ uploadDate: -1 })
      .lean();

    // Get unique user IDs from files that have userId
    const userIds = [
      ...new Set(files.map((file) => file.userId).filter(Boolean)),
    ]; // Fetch user data for all user IDs
    const users = await User.find(
      { _id: { $in: userIds } },
      { name: 1, email: 1 }
    ).lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const fileList = files.map((file) => {
      const user = file.userId ? userMap.get(file.userId) : null;

      return {
        id: file._id.toString(),
        name: file.filename,
        originalName: file.originalName,
        size: file.size,
        uploadDate: file.uploadDate.toISOString(),
        expiresAt: file.expiresAt ? file.expiresAt.toISOString() : null,
        mimeType: file.mimeType,
        downloadCount: file.downloadCount || 0,
        type: getFileType(file.mimeType),
        userId: file.userId || null,
        userName: user ? user.name : null,
        isAnonymous: file.isAnonymous !== false, // Default to true if not explicitly false
      };
    });

    return NextResponse.json({ files: fileList });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

function getFileType(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  )
    return 'document';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('archive')
  )
    return 'archive';
  return 'other';
}
