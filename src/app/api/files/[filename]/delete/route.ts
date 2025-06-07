import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { File, saveSecurityEvent } from "@/lib/models";
import { headers } from "next/headers";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Get session for authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    await connectDB();

    const { filename } = await params;

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Unknown";

    // Find the file in database
    const fileRecord = await File.findOne({ filename, isDeleted: false });
    if (!fileRecord) {
      // Log security event for attempted deletion of non-existent file
      await saveSecurityEvent({
        type: "suspicious_activity",
        ip,
        details: `Attempted to delete non-existent file: ${filename}`,
        severity: "medium",
        userAgent,
        filename,
      });

      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user owns the file (only authenticated users can have ownership)
    if (fileRecord.userId && fileRecord.userId.toString() !== session.user.id) {
      // Log unauthorized deletion attempt
      await saveSecurityEvent({
        type: "unauthorized_access",
        ip,
        details: `User ${session.user.id} attempted to delete file owned by ${fileRecord.userId}: ${filename}`,
        severity: "high",
        userAgent,
        filename,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You can only delete your own files",
        },
        { status: 403 }
      );
    }

    // For files without userId (public files), check if user is admin
    if (!fileRecord.userId && session.user.role !== "admin") {
      await saveSecurityEvent({
        type: "unauthorized_access",
        ip,
        details: `Non-admin user ${session.user.id} attempted to delete public file: ${filename}`,
        severity: "high",
        userAgent,
        filename,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only admins can delete public files",
        },
        { status: 403 }
      );
    }

    // Mark file as deleted in database (soft delete)
    await File.findOneAndUpdate({ filename }, { isDeleted: true });

    // Try to delete the actual file from filesystem
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadsDir, filename);
      await unlink(filePath);
    } catch (fsError) {
      // File might already be deleted or not exist on filesystem
      console.warn(
        `Could not delete file from filesystem: ${filename}`,
        fsError
      );
    }

    // Log successful deletion
    await saveSecurityEvent({
      type: "file_deletion",
      ip,
      details: `File deleted: ${fileRecord.originalName} (${filename})`,
      severity: "low",
      userAgent,
      filename,
      fileSize: fileRecord.size,
      fileType: fileRecord.mimeType,
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    // Log error as security event
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "127.0.0.1";

    try {
      const { filename } = await params;
      await saveSecurityEvent({
        type: "suspicious_activity",
        ip,
        details: `File deletion failed for: ${filename}`,
        severity: "medium",
        userAgent: headersList.get("user-agent") || "Unknown",
        filename: filename,
      });
    } catch (logError) {
      console.error("Failed to log security event:", logError);
    }

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
