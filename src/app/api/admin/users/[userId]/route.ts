import { withAdminAPIParams } from '@/lib/middleware';
import { User } from '@/lib/database/models';
import type { AuthenticatedRequest } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

async function deleteUserHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    
    console.log('🗑️ Deleting user:', userId, 'by admin:', request.user.email);
    
    // Prevent admin from deleting themselves
    if (userId === request.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ User deleted successfully:', deletedUser.email);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export const DELETE = withAdminAPIParams(deleteUserHandler);

// Handler for activating a user
async function activateUserHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    
    console.log('✅ Activating user:', userId, 'by admin:', request.user.email);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ User activated successfully:', updatedUser.email);
    
    return NextResponse.json({
      success: true,
      message: 'User activated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error activating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate user' },
      { status: 500 }
    );
  }
}

// Handler for deactivating a user
async function deactivateUserHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    
    console.log('⏸️ Deactivating user:', userId, 'by admin:', request.user.email);
    
    // Prevent admin from deactivating themselves
    if (userId === request.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('⏸️ User deactivated successfully:', updatedUser.email);
    
    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deactivating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}

// Handler for changing user role
async function changeRoleHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { role } = await request.json();
    
    console.log('🔄 Changing user role:', userId, 'to:', role, 'by admin:', request.user.email);
    
    // Prevent admin from changing their own role
    if (userId === request.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('🔄 User role changed successfully:', updatedUser.email, 'is now', role);
    
    return NextResponse.json({
      success: true,
      message: `User role changed to ${role} successfully`
    });
    
  } catch (error) {
    console.error('❌ Error changing user role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change user role' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAPIParams(async (
  request: AuthenticatedRequest, 
  context: { params: Promise<{ userId: string }> }
) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  switch (action) {
    case 'activate':
      return activateUserHandler(request, context);
    case 'deactivate':
      return deactivateUserHandler(request, context);
    default:
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
  }
});

// Handler for updating user information (full edit)
async function updateUserHandler(
  request: AuthenticatedRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { name, email, role } = await request.json();
    
    console.log('✏️ Updating user:', userId, 'by admin:', request.user.email);
    
    // Prevent admin from editing themselves (for role changes)
    if (userId === request.user.id && role && role !== request.user.role) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      );
    }
    
    // Validate role if provided
    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('✏️ User updated successfully:', updatedUser.email);    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export const PATCH = withAdminAPIParams(changeRoleHandler);
export const PUT = withAdminAPIParams(updateUserHandler);
