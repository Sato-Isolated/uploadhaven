import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, saveSecurityEvent } from "@/lib/models";
import { headers } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Unknown";

    const { userId } = await params;
    const { role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Valid role (admin or user) is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const oldRole = user.role;

    // Update user role
    await User.findByIdAndUpdate(userId, { role });

    // Log security event
    await saveSecurityEvent({
      type: "user_role_changed",
      ip,
      details: `User ${user.email} role changed from ${oldRole} to ${role} by admin`,
      severity: "high",
      userAgent,
      metadata: {
        userId: userId,
        userEmail: user.email,
        oldRole,
        newRole: role,
        adminAction: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} role updated to ${role} successfully`,
    });
  } catch (error) {
    console.error("User role update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
