import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();

    // Fetch all users with basic info
    const users = await User.find(
      {},
      {
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        emailVerified: 1,
        isActive: 1,
      }
    ).sort({ createdAt: -1 });

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
