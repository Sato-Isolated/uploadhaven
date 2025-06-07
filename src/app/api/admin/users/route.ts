import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();    // Fetch all users with basic info
    const usersFromDB = await User.find(
      {},
      {
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        emailVerified: 1,
        lastActivity: 1,
      }
    ).sort({ createdAt: -1 });

    // Transform _id to id for frontend compatibility
    const users = usersFromDB.map(user => {
      // Consider user active if they've been active in the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isActive = user.lastActivity && user.lastActivity > thirtyDaysAgo;
      
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.emailVerified,
        isActive: isActive,
        createdAt: user.createdAt.toISOString(),
        lastActiveAt: user.lastActivity ? user.lastActivity.toISOString() : user.createdAt.toISOString(),
        storageUsed: 0, // TODO: Calculate actual storage used
        fileCount: 0, // TODO: Calculate actual file count
      };
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
