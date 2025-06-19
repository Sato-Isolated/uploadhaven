import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/database/mongodb';
import { File } from '@/lib/database/models';

/**
 * POST /api/admin/cleanup/expired
 * Clean up expired files (Zero Knowledge compliant)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Add proper admin role check
    // For now, just check if user is authenticated

    await connectDB();

    // Find and delete expired files
    const now = new Date();
    const expiredFiles = await File.find({
      expiresAt: { $lt: now }
    });

    const deletedCount = expiredFiles.length;

    // Delete expired files from database
    await File.deleteMany({
      expiresAt: { $lt: now }
    });

    // TODO: Delete physical files from storage
    // This would need to be implemented based on your storage solution
    // for (const file of expiredFiles) {
    //   await deletePhysicalFile(file.fileName);
    // }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} expired files`,
      deletedCount
    });

  } catch (error) {
    console.error('Cleanup expired files error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired files' },
      { status: 500 }
    );
  }
}
