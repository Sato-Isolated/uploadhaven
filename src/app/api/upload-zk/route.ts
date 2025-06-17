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
  generateZKShareLink,
  type ZKEncryptedPackage,
} from '@/lib/encryption/zero-knowledge';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for encrypted blobs

// Zero-Knowledge upload validation schema
const zkUploadSchema = z.object({
  encryptedData: z
    .any()
    .refine(
      (data) => data instanceof ArrayBuffer,
      'Encrypted data must be an ArrayBuffer'
    )
    .refine(
      (data) => data.byteLength <= MAX_FILE_SIZE,
      'Encrypted data size must be less than 100MB'
    ),
  publicMetadata: z.object({
    size: z.number().positive(),
    algorithm: z.string(),
    iv: z.string(),
    salt: z.string(),
    iterations: z.number().positive(),
    uploadTimestamp: z.number(),
  }),
  keyData: z.object({
    key: z.string().optional(), // Present for random key encryption
    salt: z.string(),
    isPasswordDerived: z.boolean(),
  }),
  // Optional password protection (separate from encryption password)
  password: z.string().optional(),
  expiration: z.enum(['1h', '24h', '7d', '30d', 'never']).default('24h'),
  userId: z.string().optional(),
});

// Expiration options (in hours)
const EXPIRATION_OPTIONS = {
  '1h': 1,
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  never: 0,
} as const;

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get session for authenticated uploads
    let session = null;
    try {
      session = await auth.api.getSession({ headers: await headers() });
    } catch {
      // Session not required for anonymous uploads
    }

    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Apply rate limiting
    let rateLimitCheck;
    try {
      rateLimitCheck = rateLimit(rateLimitConfigs.upload)(request);
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return NextResponse.json(
        { success: false, error: 'Rate limit service unavailable' },
        { status: 503 }
      );
    }

    if (!rateLimitCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many upload attempts. Please try again later.',
          retryAfter: Math.ceil(
            (rateLimitCheck.reset.getTime() - Date.now()) / 1000
          ),
        },
        { status: 429 }
      );
    }

    // Parse request body as JSON (contains encrypted package)
    let requestData;
    try {
      const body = await request.text();
      requestData = JSON.parse(body);

      // Convert base64 encoded encrypted data back to ArrayBuffer
      if (requestData.encryptedPackage?.encryptedData) {
        const base64Data = requestData.encryptedPackage.encryptedData;
        const binaryString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        requestData.encryptedPackage.encryptedData = arrayBuffer;
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { encryptedPackage, keyData, password, expiration, userId } =
      requestData;

    // Validate the encrypted package structure
    if (!validateZKEncryptedPackage(encryptedPackage)) {
      return NextResponse.json(
        { success: false, error: 'Invalid encrypted package format' },
        { status: 400 }
      );
    }

    // Validate form data
    const validation = zkUploadSchema.safeParse({
      encryptedData: encryptedPackage.encryptedData,
      publicMetadata: encryptedPackage.publicMetadata,
      keyData,
      password,
      expiration,
      userId,
    });

    if (!validation.success) {
      console.error('ZK Upload validation failed:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Handle password protection (separate from encryption)
    let hashedPassword: string | undefined = undefined;
    let isPasswordProtected = false;

    if (password && password.trim()) {
      try {
        const passwordValidation = validatePassword(password.trim());
        if (!passwordValidation.valid) {
          return NextResponse.json(
            { success: false, error: passwordValidation.error },
            { status: 400 }
          );
        }
        hashedPassword = await hashPassword(password.trim());
        isPasswordProtected = true;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Error processing password' },
          { status: 500 }
        );
      }
    }

    // Validate user authentication if userId is provided
    if (userId && (!session?.user || session.user.id !== userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user authentication' },
        { status: 401 }
      );
    }

    // Validate expiration
    if (!Object.keys(EXPIRATION_OPTIONS).includes(expiration)) {
      return NextResponse.json(
        { success: false, error: 'Invalid expiration option' },
        { status: 400 }
      );
    }

    console.log('✓ Zero-Knowledge upload validation passed');

    // Generate unique filename for the encrypted blob
    const uniqueId = nanoid(10);
    const fileName = `${uniqueId}.zkenc`; // .zkenc for Zero-Knowledge encrypted

    // Store in appropriate subdirectory
    const subDir = isPasswordProtected ? 'protected' : 'public';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    await mkdir(uploadsDir, { recursive: true });

    // Write the encrypted blob to disk
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(encryptedPackage.encryptedData);
    await writeFile(filePath, buffer);

    // Generate file URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${subDir}/${fileName}`;

    // Calculate expiration date
    const expirationHours =
      EXPIRATION_OPTIONS[expiration as keyof typeof EXPIRATION_OPTIONS];
    const expiresAt =
      expirationHours > 0
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for "never"

    // Generate unique short URL
    const shortId = await generateShortUrl();

    // Generate Zero-Knowledge compatible share URL
    const shareableUrl = generateZKShareLink(baseUrl, shortId, keyData);

    // Save file metadata to MongoDB
    const savedFile = await saveFileMetadata({
      filename: `${subDir}/${fileName}`,
      shortUrl: shortId,
      originalName: '[Zero-Knowledge Encrypted]', // Hidden for security
      mimeType: 'application/octet-stream', // Generic binary type
      size: encryptedPackage.publicMetadata.size, // Size of encrypted data
      expiresAt,
      ipAddress: clientIP,
      userAgent,
      userId: session?.user?.id || undefined,
      isAnonymous: !session?.user?.id,
      password: hashedPassword,
      isPasswordProtected,

      // Legacy encryption fields (set to false for ZK files)
      isEncrypted: false,

      // Zero-Knowledge fields
      isZeroKnowledge: true,
      zkMetadata: {
        algorithm: encryptedPackage.publicMetadata.algorithm,
        iv: encryptedPackage.publicMetadata.iv,
        salt: encryptedPackage.publicMetadata.salt,
        iterations: encryptedPackage.publicMetadata.iterations,
        encryptedSize: encryptedPackage.publicMetadata.size,
        uploadTimestamp: encryptedPackage.publicMetadata.uploadTimestamp,
        keyHint: keyData.isPasswordDerived ? 'password' : 'embedded',
      },

      scanResult: {
        safe: true, // ZK files can't be scanned, assume safe
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
        console.error('Failed to update user lastActivity:', error);
      }
    }

    // Log successful upload
    await saveSecurityEvent({
      type: 'zk_file_upload',
      ip: clientIP,
      details: `Zero-Knowledge encrypted file uploaded successfully`,
      severity: 'low',
      userAgent,
      filename: fileName,
      fileSize: encryptedPackage.publicMetadata.size,
      fileType: 'application/octet-stream',
      userId: session?.user?.id || undefined,
      metadata: {
        zeroKnowledge: true,
        algorithm: encryptedPackage.publicMetadata.algorithm,
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
            'Your encrypted file has been uploaded successfully and is ready to share',
          priority: 'normal',
          relatedFileId: savedFile._id.toString(),
          actionUrl: shareableUrl,
          metadata: {
            filename: '[Encrypted]',
            fileSize: encryptedPackage.publicMetadata.size,
            shareableUrl,
            isPasswordProtected,
            isZeroKnowledge: true,
            expiresAt: expiresAt.toISOString(),
          },
        });
      } catch (notificationError) {
        console.error(
          'Failed to create upload notification:',
          notificationError
        );
      }
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      shortUrl: shareableUrl,
      filename: fileName,
      originalName: '[Zero-Knowledge Encrypted]',
      size: encryptedPackage.publicMetadata.size,
      type: 'application/octet-stream',
      expiresAt: expiresAt.toISOString(),
      isZeroKnowledge: true,
      keyHint: keyData.isPasswordDerived ? 'password' : 'embedded',
      metadata: {
        id: savedFile._id,
        uploadDate: savedFile.uploadDate,
        zkInfo: {
          algorithm: encryptedPackage.publicMetadata.algorithm,
          encryptedSize: encryptedPackage.publicMetadata.size,
        },
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
        details: `Zero-Knowledge upload error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'high',
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch {
      // If logging fails, continue
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
