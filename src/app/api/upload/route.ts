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
  encryptFile,
  generateSecurePassword,
} from '@/lib/encryption/encryption';
import {
  shouldEncryptFile,
  getDefaultEncryptionPassword,
  areUserPasswordsAllowed,
} from '@/lib/encryption/encryption-config';
import {
  generateEncryptedThumbnail,
  thumbnailCache,
} from '@/lib/encryption/thumbnail-encryption';
import {
  PerformanceEncryption,
  PerformanceMetrics,
  PERFORMANCE_CONFIG,
} from '@/lib/encryption/performance-encryption';
import type { IFile } from '@/types/database';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/pdf',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
  'application/octet-stream', // Allow encrypted blobs for ZK uploads
];

const uploadSchema = z.object({
  file: z
    .any()
    .refine(
      (file) =>
        file && typeof file === 'object' && 'size' in file && 'type' in file,
      'Invalid file object'
    )
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      'File size must be less than 100MB'
    )
    .refine(
      (file) => ALLOWED_TYPES.includes(file.type),
      'File type not allowed'
    ),
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
      session = await auth.api.getSession({
        headers: await headers(),
      });
      // Session retrieved successfully
    } catch {
      // Session error, continuing without session
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
      // Rate limit check completed
    } catch {
      // Rate limit error, continue without rate limiting
      rateLimitCheck = { success: true };
    }
    if (!rateLimitCheck.success) {
      // Rate limit exceeded
      // Log rate limit hit
      await saveSecurityEvent({
        type: 'rate_limit',
        ip: clientIP,
        details: `Upload rate limit exceeded: ${
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
    let formData;
    try {
      formData = await request.formData(); // FormData parsed successfully
    } catch {
      // FormData parsing failed
      return NextResponse.json(
        { success: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }
    const file = formData.get('file') as File;
    const expiration = (formData.get('expiration') as string) || '24h';
    // Visibility removed - all files use security by obscurity
    const userId = formData.get('userId') as string;
    const password = (formData.get('password') as string) || null;
    const autoGenerateKey = formData.get('autoGenerateKey') === 'true';
    // New encryption fields
    const requestEncryption = formData.get('requestEncryption') === 'true';
    const encryptionPassword =
      (formData.get('encryptionPassword') as string) || null;

    // Handle password protection or auto-generate key (separate from ZK encryption)
    let hashedPassword: string | undefined = undefined;
    let isPasswordProtected = false;
    let generatedKey: string | undefined = undefined;
    if (autoGenerateKey) {
      // Generate a secure random key
      generatedKey = nanoid(16); // Generate 16-character secure key
      hashedPassword = await hashPassword(generatedKey);
      isPasswordProtected = true;
      // Automatic key generated and hashed
    } else if (password && password.trim()) {
      // Validating provided password
      try {
        const passwordValidation = validatePassword(password.trim());
        // Password validation completed

        if (!passwordValidation.valid) {
          // Password validation failed
          return NextResponse.json(
            { success: false, error: passwordValidation.error },
            { status: 400 }
          );
        }
        hashedPassword = await hashPassword(password.trim());
        isPasswordProtected = true;
        // Password hashed successfully
      } catch {
        // Error processing password
        return NextResponse.json(
          { success: false, error: 'Error processing password' },
          { status: 400 }
        );
      }
    }

    if (!file) {
      // No file provided
      await saveSecurityEvent({
        type: 'invalid_file',
        ip: clientIP,
        details: 'Upload attempt with no file provided',
        severity: 'low',
        userAgent,
      });

      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    } // File details extracted successfully

    // Visibility validation removed - all files use security by obscurity

    // Validate user authentication if userId is provided
    if (userId && (!session?.user || session.user.id !== userId)) {
      // Invalid user authentication
      return NextResponse.json(
        { success: false, error: 'Invalid user authentication' },
        { status: 401 }
      );
    }

    // Validate expiration
    if (!Object.keys(EXPIRATION_OPTIONS).includes(expiration)) {
      // Invalid expiration
      return NextResponse.json(
        { success: false, error: 'Invalid expiration option' },
        { status: 400 }
      );
    }
    // Expiration valid    // Check for Zero-Knowledge metadata first
    const zkMetadataStr = formData.get('zkMetadata') as string;
    const isZeroKnowledgeFlag = formData.get('isZeroKnowledge') === 'true';
    const zkEncryptionKey = formData.get('zkEncryptionKey') as string;
    let zkMetadata: {
      iv: string;
      salt: string;
      iterations?: number;
      originalName: string;
      originalType: string;
      originalSize: string;
      encryptionKey?: string;
    } | null = null;
    let isZeroKnowledge = false;

    if (zkMetadataStr || isZeroKnowledgeFlag) {
      try {
        zkMetadata = zkMetadataStr ? JSON.parse(zkMetadataStr) : {};
        isZeroKnowledge = true;
        // Zero-Knowledge upload detected
      } catch (error) {
        console.error('Failed to parse ZK metadata:', error);
      }
    }

    // Validate file (with special handling for ZK uploads)
    // Starting file validation
    let validation;
    if (isZeroKnowledge) {
      // For ZK uploads, we need to validate the original file type from metadata
      const originalType = zkMetadata?.originalType;
      if (originalType && !ALLOWED_TYPES.includes(originalType)) {
        validation = {
          success: false,
          error: { issues: [{ message: 'Original file type not allowed' }] },
        };
      } else {
        // ZK files are always application/octet-stream, which we allow
        validation = { success: true };
      }
    } else {
      // Regular validation for non-ZK uploads
      validation = uploadSchema.safeParse({ file });
    }
    // File validation completed

    if (!validation.success) {
      // File validation failed
      const errorMessage =
        validation.error?.issues?.[0]?.message || 'File validation failed';
      await saveSecurityEvent({
        type: 'invalid_file',
        ip: clientIP,
        details: `File validation failed: ${errorMessage}`,
        severity: 'medium',
        userAgent,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }
    // File validation passed
    // Validations complete// Get file extension
    const fileExtension = path.extname(file.name) || '';

    // Generate unique filename
    const uniqueId = nanoid(10);
    const fileName = `${uniqueId}${fileExtension}`;

    // Determine which subdirectory to use based on password protection
    const subDir = isPasswordProtected ? 'protected' : 'public';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    await mkdir(uploadsDir, { recursive: true });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes); // Determine if file should be encrypted (skip for ZK uploads as they're already encrypted)
    const shouldEncrypt =
      !isZeroKnowledge &&
      shouldEncryptFile(file.size, file.type, requestEncryption);
    let encryptionMetadata:
      | {
          salt: string;
          iv: string;
          tag: string;
          algorithm: string;
          iterations: number;
        }
      | undefined = undefined;
    let encryptionPasswordToUse: string | undefined;

    // Handle Zero-Knowledge uploads (already encrypted client-side)
    if (isZeroKnowledge && zkMetadata) {
      // Processing Zero-Knowledge upload - file already encrypted client-side
      // Use ZK metadata directly, no server-side encryption needed
      encryptionMetadata = {
        salt: zkMetadata.salt,
        iv: zkMetadata.iv,
        tag: '', // Will be handled differently for ZK uploads
        algorithm: 'aes-256-gcm',
        iterations: zkMetadata.iterations || 100000,
      };
    } else if (shouldEncrypt) {
      // Determine encryption password - Secured mode only uses system password
      if (encryptionPassword && areUserPasswordsAllowed()) {
        encryptionPasswordToUse = encryptionPassword;
      } else {
        // Secured mode: always use system password
        encryptionPasswordToUse = getDefaultEncryptionPassword();
        if (!encryptionPasswordToUse) {
          // Generate a secure password if none is configured (fallback)
          encryptionPasswordToUse = generateSecurePassword(32);
          console.warn(
            '⚠️  No default encryption password set - generated temporary password'
          );
        }
      }

      try {
        // Starting performance-optimized encryption
        const timer = PerformanceMetrics.startTiming('file-encryption');

        // Determine if we should use performance optimizations
        const useOptimizations =
          file.size >= PERFORMANCE_CONFIG.STREAM_THRESHOLD ||
          file.size >= PERFORMANCE_CONFIG.COMPRESSION_THRESHOLD;

        let encryptionResult;

        if (useOptimizations) {
          // File size: using performance optimizations
          encryptionResult = await PerformanceEncryption.encryptFileOptimized(
            buffer,
            encryptionPasswordToUse,
            {
              mimeType: file.type,
              enableCompression: true,
              useParallel: file.size >= PERFORMANCE_CONFIG.PARALLEL_THRESHOLD,
            }
          );
        } else {
          // File size: using standard encryption
          encryptionResult = await encryptFile(buffer, encryptionPasswordToUse);
        }

        buffer = Buffer.from(encryptionResult.encryptedBuffer);
        encryptionMetadata = encryptionResult.metadata;
        timer.end(file.size);

        // File encrypted successfully with performance optimizations
      } catch (encryptionError) {
        console.error('❌ Performance encryption error:', encryptionError);
        await saveSecurityEvent({
          type: 'encryption_error',
          ip: clientIP,
          details: `File encryption failed: ${encryptionError instanceof Error ? encryptionError.message : 'Unknown error'}`,
          severity: 'high',
          userAgent,
          filename: file.name,
          fileSize: file.size,
          fileType: file.type,
          userId: session?.user?.id || undefined,
        });

        return NextResponse.json(
          { success: false, error: 'File encryption failed' },
          { status: 500 }
        );
      }
    }

    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer); // Generate file URL (include the subdirectory)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${subDir}/${fileName}`;

    // Calculate expiration date
    const expirationHours =
      EXPIRATION_OPTIONS[expiration as keyof typeof EXPIRATION_OPTIONS];
    const expiresAt =
      expirationHours > 0
        ? new Date(Date.now() + expirationHours * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for "never"    // Generate unique short URL with ZK support - ALWAYS include ZK encryption key
    const zkData = {
      key: zkEncryptionKey,
      keyHint: 'random' as const,
    };

    const shareableUrl = await generateShortUrl(undefined, zkData);
    // Extract shortId from the generated URL for DB storage
    const shortId = shareableUrl.split('/s/')[1]?.split('#')[0] || shareableUrl; // Save file metadata to MongoDB with Zero-Knowledge metadata
    const savedFile = await saveFileMetadata({
      filename: `${subDir}/${fileName}`, // Include subdirectory in filename for proper file location
      shortUrl: shortId,
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
      isPasswordProtected, // Zero-Knowledge metadata (files are stored encrypted but will be decrypted client-side)
      isZeroKnowledge: isZeroKnowledge,      zkMetadata:
        isZeroKnowledge && zkMetadata
          ? {
              algorithm: 'AES-GCM',
              iv: zkMetadata.iv,
              salt: zkMetadata.salt,
              iterations: zkMetadata.iterations || 100000,
              encryptedSize: buffer.length,
              uploadTimestamp: Date.now(),
              keyHint: zkMetadata.encryptionKey ? 'embedded' : 'password',
              // Include original file metadata for client-side handling
              originalType: zkMetadata.originalType,
              originalName: zkMetadata.originalName,
              originalSize: zkMetadata.originalSize,
            }
          : undefined,
      // Legacy encryption metadata (still encrypt server-side for backward compatibility)
      isEncrypted: shouldEncrypt,
      encryptionMetadata: encryptionMetadata
        ? {
            ...encryptionMetadata,
            encryptedSize: buffer.length, // Size of encrypted data
          }
        : undefined,
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
        console.error('Failed to update user lastActivity:', error);
      }
    } // Log successful upload
    await saveSecurityEvent({
      type: shouldEncrypt ? 'encryption_success' : 'file_upload',
      ip: clientIP,
      details: shouldEncrypt
        ? `File uploaded and encrypted successfully: ${file.name}`
        : `File uploaded successfully: ${file.name}`,
      severity: 'low',
      userAgent,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: session?.user?.id || undefined,
      metadata: shouldEncrypt
        ? {
            encrypted: true,
            algorithm: encryptionMetadata?.algorithm,
            originalSize: file.size,
            encryptedSize: buffer.length,
          }
        : undefined,
    });

    // Create notification for authenticated users
    if (session?.user?.id) {
      try {
        await saveNotification({
          userId: session.user.id,
          type: 'file_upload_complete',
          title: 'File Upload Complete',
          message: `Your file "${file.name}" has been uploaded successfully and is ready to share`,
          priority: 'normal',
          relatedFileId: savedFile._id.toString(),
          actionUrl: shareableUrl,
          metadata: {
            filename: file.name,
            fileSize: file.size,
            fileType: file.type,
            shareableUrl,
            isPasswordProtected,
            isEncrypted: shouldEncrypt,
            expiresAt: expiresAt.toISOString(),
          },
        });
      } catch (notificationError) {
        console.error(
          'Failed to create upload notification:',
          notificationError
        );
        // Don't fail the upload if notification creation fails
      }
    } // File saved successfully

    // Generate encrypted thumbnail if supported
    if (isThumbnailSupported(file.type)) {
      try {
        // Generating encrypted thumbnail
        const thumbnailResult = await generateEncryptedThumbnail(
          savedFile as IFile,
          buffer, // Pass the (possibly encrypted) buffer
          file.type
        );

        if (thumbnailResult) {
          // Cache the encrypted thumbnail
          await thumbnailCache.store(
            savedFile._id.toString(),
            shortId,
            thumbnailResult.thumbnailBuffer,
            thumbnailResult.metadata
          );
          // Encrypted thumbnail generated and cached
        }
      } catch (thumbnailError) {
        console.error(
          'Failed to generate encrypted thumbnail:',
          thumbnailError
        );
        // Don't fail the upload if thumbnail generation fails
        await saveSecurityEvent({
          type: 'thumbnail_generation_error',
          ip: clientIP,
          details: `Thumbnail generation failed for: ${file.name} - ${thumbnailError instanceof Error ? thumbnailError.message : 'Unknown error'}`,
          severity: 'medium',
          userAgent,
          filename: file.name,
          fileSize: file.size,
          fileType: file.type,
          userId: session?.user?.id || undefined,
        });
      }
    }

    // Update lastActivity for authenticated users
    if (session?.user) {
      try {
        await User.findByIdAndUpdate(session.user.id, {
          lastActivity: new Date(),
        });
      } catch (error) {
        console.error('Failed to update user lastActivity:', error);
      }
    } // Log successful upload
    await saveSecurityEvent({
      type: shouldEncrypt ? 'encryption_success' : 'file_upload',
      ip: clientIP,
      details: shouldEncrypt
        ? `File uploaded and encrypted successfully: ${file.name}`
        : `File uploaded successfully: ${file.name}`,
      severity: 'low',
      userAgent,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: session?.user?.id || undefined,
      metadata: shouldEncrypt
        ? {
            encrypted: true,
            algorithm: encryptionMetadata?.algorithm,
            originalSize: file.size,
            encryptedSize: buffer.length,
          }
        : undefined,
    });

    // Create notification for authenticated users
    if (session?.user?.id) {
      try {
        await saveNotification({
          userId: session.user.id,
          type: 'file_upload_complete',
          title: 'File Upload Complete',
          message: `Your file "${file.name}" has been uploaded successfully and is ready to share`,
          priority: 'normal',
          relatedFileId: savedFile._id.toString(),
          actionUrl: shareableUrl,
          metadata: {
            filename: file.name,
            fileSize: file.size,
            fileType: file.type,
            shareableUrl,
            isPasswordProtected,
            isEncrypted: shouldEncrypt,
            expiresAt: expiresAt.toISOString(),
          },
        });
      } catch (notificationError) {
        console.error(
          'Failed to create upload notification:',
          notificationError
        );
        // Don't fail the upload if notification creation fails
      }
    } // File saved successfully

    return NextResponse.json({
      success: true,
      url: fileUrl,
      shortUrl: shareableUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      expiresAt: expiresAt.toISOString(),
      generatedKey: generatedKey, // Include the generated password key if one was created
      zkEncryptionKey: zkEncryptionKey, // Include the ZK encryption key for client-side use
      isEncrypted: shouldEncrypt,
      encryptionPassword:
        shouldEncrypt &&
        encryptionPasswordToUse !== getDefaultEncryptionPassword()
          ? encryptionPasswordToUse
          : undefined, // Only return user-provided encryption password
      metadata: {
        id: savedFile._id,
        uploadDate: savedFile.uploadDate,
        encryptionInfo: shouldEncrypt
          ? {
              algorithm: encryptionMetadata?.algorithm,
              originalSize: file.size,
              encryptedSize: buffer.length,
            }
          : undefined,
      },
    });
  } catch (error) {
    console.error('=== UPLOAD API ERROR ===');
    console.error('Upload error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    console.error('=== END UPLOAD API ERROR ===');

    // Try to log the error
    try {
      const clientIP = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await saveSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        details: `Upload error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'high',
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
