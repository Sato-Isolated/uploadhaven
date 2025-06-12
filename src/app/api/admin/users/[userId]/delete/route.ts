import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, File, saveSecurityEvent } from '@/lib/models';
import { headers } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown';

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of admin users (safety measure)
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Find all files uploaded by the user
    const userFiles = await File.find({ userId: userId }); // Delete physical files from storage
    const deletionPromises = userFiles.map(async (file) => {
      try {
        const filePath = path.join(
          process.cwd(),
          'public',
          'uploads',
          file.filename
        );
        await unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${file.filename}:`, error);
        // Continue with deletion even if physical file removal fails
      }
    });

    await Promise.allSettled(deletionPromises);

    // Delete file records from database
    await File.deleteMany({ userId: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Log security event
    await saveSecurityEvent({
      type: 'user_deleted',
      ip,
      details: `User ${user.email} has been deleted by admin (including ${userFiles.length} files)`,
      severity: 'high',
      userAgent,
      metadata: {
        userId: userId,
        userEmail: user.email,
        deletedFilesCount: userFiles.length,
        adminAction: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} and ${userFiles.length} associated files have been deleted successfully`,
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
