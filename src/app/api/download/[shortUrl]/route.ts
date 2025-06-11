import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import connectDB from "@/lib/mongodb";
import { File, incrementDownloadCount, saveSecurityEvent } from "@/lib/models";
import { checkFileExpiration } from "@/lib/startup";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortUrl: string }> }
) {
  try {
    await connectDB();

    const { shortUrl } = await params;

    // Get client IP and user agent for logging
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // Find file by short URL
    const fileDoc = await File.findOne({
      shortUrl,
      isDeleted: false,
    });

    if (!fileDoc) {
      // Log file not found event
      await saveSecurityEvent({
        type: "file_download",
        ip: clientIP,
        details: `Download attempted for non-existent short URL: ${shortUrl}`,
        severity: "medium",
        userAgent,
      });

      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    } // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      // Instantly delete the expired file
      await checkFileExpiration(fileDoc._id.toString());

      // Log expired file download attempt
      await saveSecurityEvent({
        type: "file_download",
        ip: clientIP,
        details: `Download attempted for expired file: ${fileDoc.filename} (auto-deleted)`,
        severity: "low",
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: "File has expired" },
        { status: 410 }
      );
    }

    // Also check for instant expiration (files that just expired)
    const wasDeleted = await checkFileExpiration(fileDoc._id.toString());
    if (wasDeleted) {
      await saveSecurityEvent({
        type: "file_download",
        ip: clientIP,
        details: `Download attempted for just-expired file: ${fileDoc.filename} (auto-deleted)`,
        severity: "low",
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: "File has expired" },
        { status: 410 }
      );
    }

    // Check if file is password protected
    if (fileDoc.isPasswordProtected) {
      // For password-protected files, they should have been verified through the page
      // Check for verification token or session
      const url = new URL(request.url);
      const verified = url.searchParams.get("verified");

      if (!verified) {
        // Log unauthorized download attempt
        await saveSecurityEvent({
          type: "unauthorized_access",
          ip: clientIP,
          details: `Direct download attempt for password-protected file: ${fileDoc.filename}`,
          severity: "high",
          userAgent,
          filename: fileDoc.filename,
        });

        return NextResponse.json(
          { success: false, error: "Password verification required" },
          { status: 403 }
        );      }
    }    // Build file path - fileDoc.filename already contains the full path from uploads directory
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      fileDoc.filename
    );

    try {
      // Read file
      const fileBuffer = await readFile(filePath);

      // Increment download count
      await incrementDownloadCount(fileDoc.filename);

      // Log successful download
      await saveSecurityEvent({
        type: "file_download",
        ip: clientIP,
        details: `File downloaded: ${fileDoc.originalName}`,
        severity: "low",
        userAgent,
        filename: fileDoc.filename,
        fileSize: fileDoc.size,
        fileType: fileDoc.mimeType,
      });

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": fileDoc.mimeType,
          "Content-Length": fileDoc.size.toString(),
          "Content-Disposition": `attachment; filename="${fileDoc.originalName}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (fileError) {
      console.error("Error reading file:", fileError);

      // Log file read error
      await saveSecurityEvent({
        type: "suspicious_activity",
        ip: clientIP,
        details: `File read error for ${fileDoc.filename}: ${
          fileError instanceof Error ? fileError.message : "Unknown error"
        }`,
        severity: "medium",
        userAgent,
        filename: fileDoc.filename,
      });

      return NextResponse.json(
        { success: false, error: "File not accessible" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Download API error:", error);

    // Try to log the error
    try {
      const clientIP = request.headers.get("x-forwarded-for") || "127.0.0.1";
      await saveSecurityEvent({
        type: "suspicious_activity",
        ip: clientIP,
        details: `Download API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        severity: "high",
        userAgent: request.headers.get("user-agent") || "",
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
