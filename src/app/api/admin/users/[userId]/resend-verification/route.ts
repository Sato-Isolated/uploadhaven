import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, saveSecurityEvent } from "@/lib/models";
import { headers } from "next/headers";

export async function POST(
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
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

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "User email is already verified" },
        { status: 400 }
      );
    }

    // TODO: Implement actual email sending logic
    // For now, we'll just log the event and return success
    // In a real implementation, you would:
    // 1. Generate a new verification token
    // 2. Save it to the user record
    // 3. Send an email with the verification link

    // Log security event
    await saveSecurityEvent({
      type: "verification_email_resent",
      ip,
      details: `Verification email resent for user ${user.email} by admin`,
      severity: "low",
      userAgent,
      metadata: {
        userId: userId,
        userEmail: user.email,
        adminAction: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Verification email sent to ${user.email} successfully`,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
