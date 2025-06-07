import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, File } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();

    // Fetch all users with basic info
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

    // Calculate storage used and file count for all users using aggregation
    const userStats = await File.aggregate([
      {
        $match: {
          isDeleted: false,
          userId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$userId",
          storageUsed: { $sum: "$size" },
          fileCount: { $sum: 1 },
        },
      },
    ]);

    // Create a map for quick lookup of user stats
    const userStatsMap = new Map(
      userStats.map((stat) => [
        stat._id,
        { storageUsed: stat.storageUsed, fileCount: stat.fileCount },
      ])
    );

    // Transform _id to id for frontend compatibility
    const users = usersFromDB.map((user) => {
      // Consider user active if they've been active in the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isActive = user.lastActivity && user.lastActivity > thirtyDaysAgo;

      // Get actual stats for this user or default to 0
      const stats = userStatsMap.get(user._id.toString()) || {
        storageUsed: 0,
        fileCount: 0,
      };

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.emailVerified,
        isActive: isActive,
        createdAt: user.createdAt.toISOString(),
        lastActiveAt: user.lastActivity
          ? user.lastActivity.toISOString()
          : user.createdAt.toISOString(),
        storageUsed: stats.storageUsed,
        fileCount: stats.fileCount,
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
