import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { File, saveSecurityEvent } from "@/lib/models";
import { checkFileExpiration } from "@/lib/startup";
import path from "path";
import { readFile } from "fs/promises";
import sharp from "sharp";

const THUMBNAIL_SIZE = 200; // 200x200 pixels
const THUMBNAIL_QUALITY = 80;

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
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Check if file has expired
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      await checkFileExpiration(fileDoc._id.toString());
      return NextResponse.json(
        { success: false, error: "File has expired" },
        { status: 410 }
      );
    }

    // Check for instant expiration
    const wasDeleted = await checkFileExpiration(fileDoc._id.toString());
    if (wasDeleted) {
      return NextResponse.json(
        { success: false, error: "File has expired" },
        { status: 410 }
      );
    }

    // Only generate thumbnails for supported file types
    const mimeType = fileDoc.mimeType;
    if (!isThumbnailSupported(mimeType)) {
      return NextResponse.json(
        { success: false, error: "Thumbnail not supported for this file type" },
        { status: 400 }
      );
    }

    // Password protection check - thumbnails require same access as preview
    if (fileDoc.isPasswordProtected) {
      const password = request.nextUrl.searchParams.get('password');
      if (!password) {
        return NextResponse.json(
          { success: false, error: "Password required", passwordRequired: true },
          { status: 401 }
        );
      }
      
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, fileDoc.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    try {
      // Generate thumbnail based on file type
      const thumbnailBuffer = await generateThumbnail(fileDoc, mimeType);
      
      // Log successful thumbnail request
      await saveSecurityEvent({
        type: "file_download",
        ip: clientIP,
        details: `Thumbnail generated for: ${fileDoc.originalName}`,
        severity: "low",
        userAgent,
        filename: fileDoc.filename,
        fileSize: fileDoc.size,
        fileType: fileDoc.mimeType,
      });

      // Return thumbnail with appropriate headers
      return new NextResponse(thumbnailBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Disposition': `inline; filename="thumb_${fileDoc.filename}.webp"`,
        },
      });
      
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to generate thumbnail" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Thumbnail API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check if file type supports thumbnail generation
function isThumbnailSupported(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf'
  );
}

// Generate thumbnail based on file type
async function generateThumbnail(fileDoc: any, mimeType: string): Promise<Buffer> {
  const uploadsDir = process.env.NODE_ENV === 'production' 
    ? '/var/data/uploads' 
    : 'public/uploads';
  // Note: fileDoc.filename already contains the full path from uploads directory (e.g., "public/VavyFxmDJd.jpg")
  const filePath = path.join(process.cwd(), uploadsDir, fileDoc.filename);
  
  if (mimeType.startsWith('image/')) {
    // Generate image thumbnail
    const imageBuffer = await readFile(filePath);
    return await sharp(imageBuffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toBuffer();
      
  } else if (mimeType.startsWith('video/')) {
    // For video files, we'll create a placeholder for now
    // In production, you might want to use ffmpeg to extract video frames
    return await generatePlaceholderThumbnail('🎥', '#8B5CF6');
    
  } else if (mimeType === 'application/pdf') {
    // For PDF files, create a placeholder
    // In production, you might want to use pdf2pic or similar
    return await generatePlaceholderThumbnail('📄', '#EF4444');
    
  } else {
    throw new Error('Unsupported file type for thumbnail generation');
  }
}

// Generate placeholder thumbnail with icon and color
async function generatePlaceholderThumbnail(emoji: string, bgColor: string): Promise<Buffer> {
  const svg = `
    <svg width="${THUMBNAIL_SIZE}" height="${THUMBNAIL_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}" rx="8"/>
      <text x="50%" y="50%" font-size="60" text-anchor="middle" dominant-baseline="central" fill="white">
        ${emoji}
      </text>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg))
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer();
}
