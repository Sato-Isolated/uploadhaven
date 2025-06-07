import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { z } from "zod";
import { rateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import connectDB from "@/lib/mongodb";
import { saveFileMetadata, saveSecurityEvent, User } from "@/lib/models";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateShortUrl } from "@/lib/server-utils";
import { buildShortUrl, hashPassword, validatePassword } from "@/lib/utils";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/pdf",
  "application/zip",
  "video/mp4",
  "audio/mpeg",
];

const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be less than 100MB"
    )
    .refine(
      (file) => ALLOWED_TYPES.includes(file.type),
      "File type not allowed"
    ),
});

// Expiration options (in hours)
const EXPIRATION_OPTIONS = {
  "1h": 1,
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  never: 0,
} as const;

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get session for authenticated uploads
    let session = null;
    try {
      session = await auth.api.getSession({
        headers: await headers(),
      });
      console.log("✓ Session retrieved:", session?.user?.id || "No session");
    } catch (error) {
      console.log("⚠️ Session error (continuing without session):", error);
      session = null;
    }

    // Get client IP and user agent
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";
    console.log("✓ Client info:", {
      clientIP,
      userAgent: userAgent.substring(0, 50) + "...",
    }); // Apply rate limiting
    let rateLimitCheck;
    try {
      rateLimitCheck = rateLimit(rateLimitConfigs.upload)(request);
      console.log("✓ Rate limit check:", rateLimitCheck);
    } catch (error) {
      console.error("❌ Rate limit error:", error);
      // Continue without rate limiting if it fails
      rateLimitCheck = { success: true };
    }
    if (!rateLimitCheck.success) {
      console.log("❌ Rate limit exceeded");
      // Log rate limit hit
      await saveSecurityEvent({
        type: "rate_limit",
        ip: clientIP,
        details: `Upload rate limit exceeded: ${
          rateLimitCheck.message || "Rate limit exceeded"
        }`,
        severity: "medium",
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.message || "Rate limit exceeded",
          rateLimit: {
            limit: rateLimitCheck.limit || 0,
            remaining: rateLimitCheck.remaining || 0,
            reset: rateLimitCheck.reset || new Date(),
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": (rateLimitCheck.limit || 0).toString(),
            "X-RateLimit-Remaining": (rateLimitCheck.remaining || 0).toString(),
            "X-RateLimit-Reset": (
              rateLimitCheck.reset || new Date()
            ).toISOString(),
          },
        }
      );
    }
    let formData;
    try {
      formData = await request.formData();
      console.log("✓ FormData parsed");
    } catch (error) {
      console.error("❌ FormData parsing failed:", error);
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      );
    }
    const file = formData.get("file") as File;
    const expiration = (formData.get("expiration") as string) || "24h";
    // Visibility removed - all files use security by obscurity
    const userId = formData.get("userId") as string;
    const password = (formData.get("password") as string) || null;
    const autoGenerateKey = formData.get("autoGenerateKey") === "true";

    console.log("✓ Form fields extracted:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      expiration,
      // Visibility removed - all files use security by obscurity
      hasUserId: !!userId,
      hasPassword: !!password,
      passwordLength: password?.length || 0,
      autoGenerateKey,
    }); // Handle password protection or auto-generate key
    let hashedPassword: string | undefined = undefined;
    let isPasswordProtected = false;
    let generatedKey: string | undefined = undefined;

    if (autoGenerateKey) {
      // Generate a secure random key
      console.log("🔑 Generating automatic key...");
      generatedKey = nanoid(16); // Generate 16-character secure key
      hashedPassword = await hashPassword(generatedKey);
      isPasswordProtected = true;
      console.log("✓ Automatic key generated and hashed");
    } else if (password && password.trim()) {
      console.log("🔑 Validating provided password...");
      try {
        const passwordValidation = validatePassword(password.trim());
        console.log("🔑 Password validation result:", passwordValidation);

        if (!passwordValidation.valid) {
          console.log(
            "❌ Password validation failed:",
            passwordValidation.error
          );
          return NextResponse.json(
            { success: false, error: passwordValidation.error },
            { status: 400 }
          );
        }
        hashedPassword = await hashPassword(password.trim());
        isPasswordProtected = true;
        console.log("✓ Password hashed successfully");
      } catch (error) {
        console.error("❌ Error processing password:", error);
        return NextResponse.json(
          { success: false, error: "Error processing password" },
          { status: 400 }
        );
      }
    }

    if (!file) {
      console.log("❌ No file provided");
      await saveSecurityEvent({
        type: "invalid_file",
        ip: clientIP,
        details: "Upload attempt with no file provided",
        severity: "low",
        userAgent,
      });

      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("📁 File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    // Visibility validation removed - all files use security by obscurity

    // Validate user authentication if userId is provided
    if (userId && (!session?.user || session.user.id !== userId)) {
      console.log("❌ Invalid user authentication");
      return NextResponse.json(
        { success: false, error: "Invalid user authentication" },
        { status: 401 }
      );
    }

    // Validate expiration
    if (!Object.keys(EXPIRATION_OPTIONS).includes(expiration)) {
      console.log("❌ Invalid expiration:", expiration);
      return NextResponse.json(
        { success: false, error: "Invalid expiration option" },
        { status: 400 }
      );
    }
    console.log("✓ Expiration valid:", expiration);

    // Validate file
    console.log("🔍 Starting file validation...");
    const validation = uploadSchema.safeParse({ file });
    console.log("🔍 File validation result:", validation);

    if (!validation.success) {
      console.log("❌ File validation failed:", validation.error.issues);
      await saveSecurityEvent({
        type: "invalid_file",
        ip: clientIP,
        details: `File validation failed: ${validation.error.issues[0].message}`,
        severity: "medium",
        userAgent,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    console.log("✓ File validation passed");

    console.log("=== UPLOAD API DEBUG: VALIDATIONS COMPLETE ===");

    // Get file extension
    const fileExtension = path.extname(file.name) || "";

    // Generate unique filename
    const uniqueId = nanoid(10);
    const fileName = `${uniqueId}${fileExtension}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Generate file URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const fileUrl = `${baseUrl}/uploads/${fileName}`; // Calculate expiration date
    const expirationHours =
      EXPIRATION_OPTIONS[expiration as keyof typeof EXPIRATION_OPTIONS];
    const expiresAt =
      expirationHours > 0
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for "never"

    // Generate unique short URL
    const shortUrl = await generateShortUrl();
    const shareableUrl = buildShortUrl(shortUrl); // Save file metadata to MongoDB
    const savedFile = await saveFileMetadata({
      filename: fileName,
      shortUrl,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      expiresAt,
      ipAddress: clientIP,
      userAgent,
      userId: session?.user?.id || undefined,
      isAnonymous: !session?.user?.id,
      // Visibility removed - all files use security by obscurity
      password: hashedPassword,
      isPasswordProtected,
      scanResult: {
        safe: true, // This would be updated by actual file scanning
        scanDate: new Date(),
      },
    });

    // Update lastActivity for authenticated users
    if (session?.user) {
      try {
        await User.findByIdAndUpdate(session.user.id, {
          lastActivity: new Date(),
        });
      } catch (error) {
        console.error("Failed to update user lastActivity:", error);
      }
    }

    // Log successful upload
    await saveSecurityEvent({
      type: "file_upload",
      ip: clientIP,
      details: `File uploaded successfully: ${file.name}`,
      severity: "low",
      userAgent,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: session?.user?.id || undefined,
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      shortUrl: shareableUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      expiresAt: expiresAt.toISOString(),
      generatedKey: generatedKey, // Include the generated key if one was created
      metadata: {
        id: savedFile._id,
        uploadDate: savedFile.uploadDate,
      },
    });
  } catch (error) {
    console.error("=== UPLOAD API ERROR ===");
    console.error("Upload error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("=== END UPLOAD API ERROR ===");

    // Try to log the error
    try {
      const clientIP = request.headers.get("x-forwarded-for") || "127.0.0.1";
      await saveSecurityEvent({
        type: "suspicious_activity",
        ip: clientIP,
        details: `Upload error: ${
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

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}
