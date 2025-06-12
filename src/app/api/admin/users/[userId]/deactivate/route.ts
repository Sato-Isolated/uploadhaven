import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, saveSecurityEvent } from '@/lib/models';
import { headers } from 'next/headers';

export async function POST(
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

    // Update user status to inactive
    await User.findByIdAndUpdate(userId, {
      isActive: false,
      deactivatedAt: new Date(),
    });

    // Log security event
    await saveSecurityEvent({
      type: 'user_deactivated',
      ip,
      details: `User ${user.email} has been deactivated by admin`,
      severity: 'medium',
      userAgent,
      metadata: {
        userId: userId,
        userEmail: user.email,
        adminAction: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been deactivated successfully`,
    });
  } catch (error) {
    console.error('User deactivation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}

// Endpoint to reactivate a user
export async function PATCH(
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

    // Update user status to active
    await User.findByIdAndUpdate(userId, {
      isActive: true,
      $unset: { deactivatedAt: 1 },
    });

    // Log security event
    await saveSecurityEvent({
      type: 'user_reactivated',
      ip,
      details: `User ${user.email} has been reactivated by admin`,
      severity: 'low',
      userAgent,
      metadata: {
        userId: userId,
        userEmail: user.email,
        adminAction: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been reactivated successfully`,
    });
  } catch (error) {
    console.error('User reactivation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reactivate user' },
      { status: 500 }
    );
  }
}
