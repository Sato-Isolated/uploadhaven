import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { rateLimit, rateLimitConfigs } from '@/lib/core/rateLimit';
import { withOptionalAuthAPI, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { saveFileMetadata, User } from '@/lib/database/models';
import { generateShortUrl } from '@/lib/core/server-utils';
import { hashPassword, validatePassword } from '@/lib/core/utils';
import { logSecurityEvent, logFileOperation } from '@/lib/audit/audit-service';
import { fileEventNotificationService } from '@/lib/notifications/file-event-notifications';

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
    contentCategory: z.enum(['media', 'document', 'archive', 'text', 'other']).optional(),
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
    originalType: z.string().optional(), // Original MIME type of the file
    originalName: z.string().optional(), // Original filename
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
import type { AuthenticatedRequest } from '@/lib/middleware';

export const POST = withOptionalAuthAPI(async (request: NextRequest & { user?: AuthenticatedRequest['user'] }) => {
  // Extract user from request (provided by withOptionalAuthAPI)
  const user = request.user;

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
  }  if (!rateLimitCheck.success) {
    await logSecurityEvent(
      'rate_limit_exceeded',
      `ZK upload rate limit exceeded: ${rateLimitCheck.message || 'Rate limit exceeded'}`,
      'medium',
      true,
      {
        endpoint: '/api/zk-upload',
        limit: rateLimitCheck.limit,
        remaining: rateLimitCheck.remaining,
        threatType: 'rate_limit_exceeded',
        blockedReason: 'Rate limit exceeded for ZK upload endpoint'
      },
      clientIP
    );

    const responseHeaders = new Headers();
    responseHeaders.set('X-RateLimit-Limit', (rateLimitCheck.limit || 0).toString());
    responseHeaders.set('X-RateLimit-Remaining', (rateLimitCheck.remaining || 0).toString());
    responseHeaders.set('X-RateLimit-Reset', (rateLimitCheck.reset || new Date()).toISOString());

    return createErrorResponse(
      rateLimitCheck.message || 'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      429,
      {
        rateLimit: {
          limit: rateLimitCheck.limit || 0,
          remaining: rateLimitCheck.remaining || 0,
          reset: rateLimitCheck.reset || new Date(),
        },
      }
    );
  }

  // Parse JSON body (ZK uploads use JSON, not FormData)
  let requestData;
  try {
    requestData = await request.json();
  } catch {
    return createErrorResponse('Invalid JSON data', 'INVALID_JSON', 400);
  }

  // Validate the Zero-Knowledge upload data
  const validation = zkUploadSchema.safeParse(requestData);
  if (!validation.success) {
    await logSecurityEvent(
      'invalid_file_upload',
      `ZK upload validation failed: ${validation.error.issues[0].message}`,
      'medium',
      true,
      {
        endpoint: '/api/zk-upload',
        validationError: validation.error.issues[0].message,
        threatType: 'invalid_data',
        blockedReason: 'Upload validation failed'
      },
      clientIP
    );

    return createErrorResponse(validation.error.issues[0].message, 'VALIDATION_ERROR', 400);
  }

  const { encryptedData, publicMetadata, keyData, userOptions } = validation.data;
  console.log('🔐 ZK Upload received:');
  console.log(`   Encrypted size: ${publicMetadata.size} bytes`);
  console.log(`   Algorithm: ${publicMetadata.algorithm}`);
  console.log(
    `   Key type: ${keyData.isPasswordDerived ? 'password-derived' : 'random'}`
  );
  console.log('   Base64 data length:', encryptedData.length);
  console.log('   Expected buffer size after decode:', Math.ceil(encryptedData.length * 3 / 4));
  // Convert base64 encrypted data to buffer
  let encryptedBuffer: Buffer;
  try {
    encryptedBuffer = Buffer.from(encryptedData, 'base64');
  } catch {
    return createErrorResponse('Invalid encrypted data encoding', 'INVALID_ENCODING', 400);
  }
  // Verify the buffer size matches metadata (after base64 decoding)
  if (encryptedBuffer.length !== publicMetadata.size) {
    console.error('Size mismatch:', {
      bufferLength: encryptedBuffer.length,
      expectedSize: publicMetadata.size,
      base64Length: encryptedData.length,
      calculatedBase64Size: Math.ceil(publicMetadata.size * 4 / 3), // Expected base64 size
      sizeRatio: encryptedBuffer.length / publicMetadata.size
    });
    return createErrorResponse('Encrypted data size mismatch', 'SIZE_MISMATCH', 400);
  }

  // Handle file access password protection (separate from encryption)
  let hashedPassword: string | undefined = undefined;
  let isPasswordProtected = false;
  let generatedKey: string | undefined = undefined;

  if (userOptions.autoGenerateKey) {
    generatedKey = nanoid(16);
    hashedPassword = await hashPassword(generatedKey);
    isPasswordProtected = true;  } else if (userOptions.password && userOptions.password.trim()) {
    const passwordValidation = validatePassword(userOptions.password.trim());
    if (!passwordValidation.valid) {
      return createErrorResponse(passwordValidation.error || 'Invalid password', 'INVALID_PASSWORD', 400);
    }
    hashedPassword = await hashPassword(userOptions.password.trim());
    isPasswordProtected = true;
  }

  // Validate expiration
  if (!Object.keys(EXPIRATION_OPTIONS).includes(userOptions.expiration)) {
    return createErrorResponse('Invalid expiration option', 'INVALID_EXPIRATION', 400);
  }

  try {
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
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for "never"

    // Generate short URL for sharing
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
      userAgent,      userId: user?.id || undefined,
      isAnonymous: !user?.id,
      password: hashedPassword,
      isPasswordProtected,
      
      // Zero-Knowledge specific fields
      isZeroKnowledge: true, // This is a ZK encrypted file
      zkMetadata: {
        algorithm: publicMetadata.algorithm,
        iv: publicMetadata.iv,
        salt: publicMetadata.salt,
        iterations: publicMetadata.iterations,
        encryptedSize: publicMetadata.size,
        uploadTimestamp: publicMetadata.uploadTimestamp,
        keyHint: keyData.isPasswordDerived ? 'password' : 'embedded',
        contentCategory: publicMetadata.contentCategory || 'other', // Store content category for preview
      },
    });    // Update user activity for authenticated users
    if (user) {
      try {
        await User.findByIdAndUpdate(user.id, {
          lastActivity: new Date(),
        });
      } catch (error) {
        console.error('Failed to update user lastActivity:', error);
      }
    }    // Log successful ZK upload
    await logFileOperation(
      'file_upload_success',
      `Zero-Knowledge file uploaded successfully (${publicMetadata.size} bytes)`,
      savedFile._id.toString(),
      fileName,
      shortId,
      user?.id,
      {
        fileSize: publicMetadata.size,
        fileType: 'application/octet-stream',
        zeroKnowledge: true,
        algorithm: publicMetadata.algorithm,
        keyType: keyData.isPasswordDerived ? 'password' : 'embedded',
        encrypted: true,
        passwordProtected: isPasswordProtected,
        downloadLimit: undefined, // ZK files don't have download limits in this implementation
        expiresAt: expiresAt
      },
      clientIP
    );    // Create notification for authenticated users using the proper service
    if (user?.id) {
      try {
        await fileEventNotificationService.notifyFileUploaded({
          fileId: savedFile._id.toString(),
          filename: userOptions.originalName || fileName,
          userId: user.id,
          fileSize: publicMetadata.size,
          expiresAt: expiresAt,
          shareUrl: shareableUrl,
          isZeroKnowledge: true,
          isPasswordProtected: isPasswordProtected,
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
    return createSuccessResponse({
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
    });  } catch (error) {
    console.error('ZK Upload processing error:', error);

    // Log the error
    await logSecurityEvent(
      'upload_processing_error',
      `ZK upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'high',
      false,
      {
        endpoint: '/api/zk-upload',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'processing_failure',
        threatType: 'system_error'
      },
      clientIP
    );

    return createErrorResponse('Failed to process upload', 'UPLOAD_PROCESSING_ERROR', 500);
  }
});

/**
 * GET /api/zk-upload
 * Not allowed - only POST uploads are supported
 */
export async function GET() {
  return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
}
