import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { rateLimit, rateLimitConfigs } from '@/lib/core/rateLimit';
import connectDB from '@/lib/database/mongodb';
import {
  saveFileMetadata,
  saveSecurityEvent,
  saveNotification,
  User,
} from '@/lib/database/models';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { generateShortUrl } from '@/lib/core/server-utils';
import { hashPassword, validatePassword } from '@/lib/core/utils';
import {
  validateZKEncryptedPackage,
  type ZKEncryptedPackage,
} from '@/lib/encryption/zero-knowledge';

const MAX_ENCRYPTED_SIZE = 150 * 1024 * 1024; // 150MB (accounting for encryption overhead)

// Zero-Knowledge upload schema validation
const zkUploadSchema = z.object({
  encryptedData: z.string(), // Base64 encoded encrypted blob
  publicMetadata: z.object({
    size: z.number().min(1).max(MAX_ENCRYPTED_SIZE),
    algorithm: z.string(),
    iv: z.string(),
    salt: z.string(),
    iterations: z.number(),
    uploadTimestamp: z.number(),
  }),
  keyData: z.object({
    key: z.string().optional(), // For random key encryption (embedded in URL)
    salt: z.string(),
    isPasswordDerived: z.boolean(),
  }),
  userOptions: z.object({
    password: z.string().optional(), // For file access protection (separate from encryption)
    autoGenerateKey: z.boolean().optional(),
    expiration: z.string().default('24h'),
  }),
});

// Expiration options (in hours)
const EXPIRATION_OPTIONS = {
  '1h': 1,
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  never: 0,
} as const;

/**
 * POST /api/zk-upload
 *
 * Zero-Knowledge file upload endpoint.
 * Accepts pre-encrypted files from the client and stores them as opaque blobs.
 * The server never has access to decryption keys or plaintext content.
 */
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
    } catch {
      session = null;
    }

    // Get client IP and user agent
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Apply rate limiting
    let rateLimitCheck;
    try {
      rateLimitCheck = rateLimit(rateLimitConfigs.upload)(request);
    } catch {
      rateLimitCheck = { success: true };
    }

    if (!rateLimitCheck.success) {
      await saveSecurityEvent({
        type: 'rate_limit',
        ip: clientIP,
        details: `ZK upload rate limit exceeded: ${
          rateLimitCheck.message || 'Rate limit exceeded'
        }`,
        severity: 'medium',
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.message || 'Rate limit exceeded',
          rateLimit: {
            limit: rateLimitCheck.limit || 0,
            remaining: rateLimitCheck.remaining || 0,
            reset: rateLimitCheck.reset || new Date(),
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': (rateLimitCheck.limit || 0).toString(),
            'X-RateLimit-Remaining': (rateLimitCheck.remaining || 0).toString(),
            'X-RateLimit-Reset': (
              rateLimitCheck.reset || new Date()
            ).toISOString(),
          },
        }
      );
    }

    // Parse JSON body (ZK uploads use JSON, not FormData)
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON data' },
        { status: 400 }
      );
    }

    // Validate the Zero-Knowledge upload data
    const validation = zkUploadSchema.safeParse(requestData);
    if (!validation.success) {
      await saveSecurityEvent({
        type: 'invalid_file',
        ip: clientIP,
        details: `ZK upload validation failed: ${validation.error.issues[0].message}`,
        severity: 'medium',
        userAgent,
      });

      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { encryptedData, publicMetadata, keyData, userOptions } =
      validation.data;

    console.log('🔐 ZK Upload received:');
    console.log(`   Encrypted size: ${publicMetadata.size} bytes`);
    console.log(`   Algorithm: ${publicMetadata.algorithm}`);
    console.log(
      `   Key type: ${keyData.isPasswordDerived ? 'password-derived' : 'random'}`
    );

    // Convert base64 encrypted data to buffer
    let encryptedBuffer: Buffer;
    try {
      encryptedBuffer = Buffer.from(encryptedData, 'base64');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid encrypted data encoding' },
        { status: 400 }
      );
    }

    // Verify the buffer size matches metadata
    if (encryptedBuffer.length !== publicMetadata.size) {
      return NextResponse.json(
        { success: false, error: 'Encrypted data size mismatch' },
        { status: 400 }
      );
    }

    // Handle file access password protection (separate from encryption)
    let hashedPassword: string | undefined = undefined;
    let isPasswordProtected = false;
    let generatedKey: string | undefined = undefined;

    if (userOptions.autoGenerateKey) {
      generatedKey = nanoid(16);
      hashedPassword = await hashPassword(generatedKey);
      isPasswordProtected = true;
    } else if (userOptions.password && userOptions.password.trim()) {
      const passwordValidation = validatePassword(userOptions.password.trim());
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { success: false, error: passwordValidation.error },
          { status: 400 }
        );
      }
      hashedPassword = await hashPassword(userOptions.password.trim());
      isPasswordProtected = true;
    }

    // Validate expiration
    if (!Object.keys(EXPIRATION_OPTIONS).includes(userOptions.expiration)) {
      return NextResponse.json(
        { success: false, error: 'Invalid expiration option' },
        { status: 400 }
      );
    }

    // Generate unique filename for encrypted blob
    const uniqueId = nanoid(10);
    const fileName = `${uniqueId}.zkblob`; // Special extension for ZK encrypted blobs

    // Determine storage subdirectory based on password protection
    const subDir = isPasswordProtected ? 'protected' : 'public';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    await mkdir(uploadsDir, { recursive: true });

    // Calculate expiration date
    const expirationHours =
      EXPIRATION_OPTIONS[
        userOptions.expiration as keyof typeof EXPIRATION_OPTIONS
      ];
    const expiresAt =
      expirationHours > 0
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for "never"    // Generate short URL for sharing
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Generate Zero-Knowledge share link with embedded key or password indicator
    const shareableUrl = await generateShortUrl(undefined, {
      key: keyData.key,
      keyHint: keyData.isPasswordDerived ? 'password' : 'random',
      baseUrl,
    });

    // Extract shortId from the generated URL for database storage
    const shortId = shareableUrl.split('/').pop()?.split('#')[0] || nanoid(8);

    // Save encrypted blob to disk
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, encryptedBuffer);

    // Save Zero-Knowledge file metadata to MongoDB
    const savedFile = await saveFileMetadata({
      filename: `${subDir}/${fileName}`,
      shortUrl: shortId,
      originalName: 'encrypted-file', // ZK files don't reveal original names
      mimeType: 'application/octet-stream', // ZK files are opaque blobs
      size: publicMetadata.size, // Size of encrypted data
      expiresAt,
      ipAddress: clientIP,
      userAgent,
      userId: session?.user?.id || undefined,
      isAnonymous: !session?.user?.id,
      password: hashedPassword,
      isPasswordProtected,
      // Zero-Knowledge specific fields
      isEncrypted: false, // Not server-side encrypted
      isZeroKnowledge: true, // This is a ZK encrypted file
      zkMetadata: {
        algorithm: publicMetadata.algorithm,
        iv: publicMetadata.iv,
        salt: publicMetadata.salt,
        iterations: publicMetadata.iterations,
        encryptedSize: publicMetadata.size,
        uploadTimestamp: publicMetadata.uploadTimestamp,
        keyHint: keyData.isPasswordDerived ? 'password' : 'embedded',
      },
      scanResult: {
        safe: true, // ZK files can't be scanned, assume safe
        scanDate: new Date(),
      },
    });

    // Update user activity for authenticated users
    if (session?.user) {
      try {
        await User.findByIdAndUpdate(session.user.id, {
          lastActivity: new Date(),
        });
      } catch (error) {
        console.error('Failed to update user lastActivity:', error);
      }
    }

    // Log successful ZK upload
    await saveSecurityEvent({
      type: 'file_upload',
      ip: clientIP,
      details: `Zero-Knowledge file uploaded successfully (${publicMetadata.size} bytes)`,
      severity: 'low',
      userAgent,
      filename: fileName,
      fileSize: publicMetadata.size,
      fileType: 'application/octet-stream',
      userId: session?.user?.id || undefined,
      metadata: {
        zeroKnowledge: true,
        algorithm: publicMetadata.algorithm,
        keyType: keyData.isPasswordDerived ? 'password' : 'embedded',
      },
    });

    // Create notification for authenticated users
    if (session?.user?.id) {
      try {
        await saveNotification({
          userId: session.user.id,
          type: 'file_upload_complete',
          title: 'Zero-Knowledge File Upload Complete',
          message:
            'Your encrypted file has been uploaded successfully with Zero-Knowledge encryption',
          priority: 'normal',
          relatedFileId: savedFile._id.toString(),
          actionUrl: shareableUrl,
          metadata: {
            zeroKnowledge: true,
            encryptedSize: publicMetadata.size,
            shareableUrl,
            isPasswordProtected,
            expiresAt: expiresAt.toISOString(),
          },
        });
      } catch (notificationError) {
        console.error(
          'Failed to create ZK upload notification:',
          notificationError
        );
      }
    }

    console.log('✅ Zero-Knowledge file uploaded successfully');

    // Return success response with share link information
    return NextResponse.json({
      success: true,
      url: shareableUrl,
      shortUrl: shareableUrl,
      filename: fileName,
      originalName: 'encrypted-file',
      size: publicMetadata.size,
      type: 'application/octet-stream',
      expiresAt: expiresAt.toISOString(),
      generatedKey: generatedKey, // If auto-generated
      isZeroKnowledge: true,
      keyType: keyData.isPasswordDerived ? 'password' : 'embedded',
      keyData: keyData.isPasswordDerived
        ? undefined
        : {
            key: keyData.key, // Only return for embedded keys
            salt: keyData.salt,
          },
      metadata: {
        id: savedFile._id,
        uploadDate: savedFile.uploadDate,
        zeroKnowledge: true,
        algorithm: publicMetadata.algorithm,
      },
    });
  } catch (error) {
    console.error('ZK Upload API error:', error);

    // Try to log the error
    try {
      const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `ZK upload error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'high',
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
