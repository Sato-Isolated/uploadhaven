import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/shared/infrastructure/api/responses';
import { withOptionalAuth, AuthenticatedRequest } from '@/shared/infrastructure/middleware/auth';
import { DomainContainer } from '@/shared/infrastructure/di/domain-container';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Zero-Knowledge upload schema validation (simplified for proper DDD)
const zkUploadSchema = z.object({
  encryptedData: z.string(), // Base64 encoded encrypted blob
  metadata: z.object({
    size: z.number().min(1).max(MAX_FILE_SIZE),
    algorithm: z.string(),
    iv: z.string(),
    salt: z.string(),
    iterations: z.number(),
    uploadTimestamp: z.number(),
  }),  userOptions: z.object({
    password: z.string().optional(),
    ttlHours: z.number().min(1).max(720).default(24), // 24h default, max 30 days
    maxDownloads: z.number().min(1).max(1000).optional(), // Optional - undefined means unlimited
    originalType: z.string().optional(),
    originalName: z.string().optional(),
  }),
});

/**
 * POST /api/zk-upload
 *
 * Zero-Knowledge file upload endpoint (DDD Architecture).
 * Uses UploadAnonymousUseCase from file-sharing domain.
 * The server never has access to decryption keys or plaintext content.
 * 
 * @architecture DDD - Uses domain services and use cases
 * @privacy Zero-Knowledge - Server cannot decrypt files
 */
export const POST = withOptionalAuth(async (request: NextRequest & { user?: AuthenticatedRequest['user'] }) => {
  const user = request.user;

  // Get client metadata for security
  const clientIP = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // Check content type - we only accept JSON now (no more legacy FormData)
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      return createErrorResponse(
        'Only JSON payloads are accepted. Legacy FormData uploads are no longer supported.',
        'INVALID_CONTENT_TYPE',
        400
      );
    }

    // Parse JSON request
    const requestData = await request.json();
    
    const validation = zkUploadSchema.safeParse(requestData);

    if (!validation.success) {
      return createErrorResponse(
        validation.error.issues[0].message,
        'VALIDATION_ERROR',
        400
      );
    }

    const { encryptedData, metadata, userOptions } = validation.data;

    // Convert base64 encrypted data to buffer and create File object
    let encryptedBuffer: Buffer;
    try {
      encryptedBuffer = Buffer.from(encryptedData, 'base64');
    } catch {
      return createErrorResponse('Invalid encrypted data encoding', 'INVALID_ENCODING', 400);
    }

    // Verify buffer size matches metadata
    if (encryptedBuffer.length !== metadata.size) {
      return createErrorResponse('Encrypted data size mismatch', 'SIZE_MISMATCH', 400);
    }    // Create a File object from the encrypted data (for legacy compatibility, not used in new DDD flow)
    const fileBlob = new Blob([encryptedBuffer], { type: userOptions.originalType || 'application/octet-stream' });
    const _file = new File([fileBlob], userOptions.originalName || 'upload.bin', {
      type: userOptions.originalType || 'application/octet-stream'
    });// Get domain container and use case
    const domainContainer = DomainContainer.getInstance();
    await domainContainer.waitForInitialization();
    const uploadUseCase = await domainContainer.getUploadAnonymousUseCase();    // Convert buffer to ArrayBuffer for the use case
    const encryptedArrayBuffer = new ArrayBuffer(encryptedBuffer.length);
    const view = new Uint8Array(encryptedArrayBuffer);
    view.set(encryptedBuffer);

    // Execute the proper DDD use case with already-encrypted data
    const uploadResult = await uploadUseCase.execute({
      encryptedData: encryptedArrayBuffer,
      metadata: {
        size: metadata.size,
        algorithm: metadata.algorithm,
        iv: metadata.iv,
        salt: metadata.salt,
        iterations: metadata.iterations,
      },
      ttlHours: userOptions.ttlHours,
      maxDownloads: userOptions.maxDownloads,
      isPasswordProtected: !!userOptions.password,
    });    console.log('🔐 ZK Upload successful:', {
      fileId: uploadResult.fileId,
      size: uploadResult.size,
      expiresAt: uploadResult.expiresAt,
      isPasswordProtected: uploadResult.isPasswordProtected
    });

    return createSuccessResponse({
      success: true,
      fileId: uploadResult.fileId,
      shareUrl: uploadResult.shareUrl,
      expiresAt: uploadResult.expiresAt.toISOString(),
      maxDownloads: uploadResult.maxDownloads,
      size: uploadResult.size,
      isPasswordProtected: uploadResult.isPasswordProtected,
    });

  } catch (error) {
    console.error('❌ ZK Upload failed:', error);    // Log security event through Privacy Domain
    try {
      const domainContainer = DomainContainer.getInstance();
      const logSecurityEventUseCase = await domainContainer.getLogSecurityEventUseCase();

      await logSecurityEventUseCase.execute({
        eventType: 'file.upload.failed',
        severity: 'medium',
        context: {
          source: 'api',
          action: 'zk-upload',
          clientIP,
          userAgent,
        },
        metadata: {
          errorCode: error instanceof Error ? error.message : 'Unknown error',
        },
        rawData: {
          userId: user?.userId,
        },
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }

    return createErrorResponse(
      'Zero-Knowledge upload failed',
      'UPLOAD_FAILED',
      500
    );
  }
});

/**
 * GET /api/zk-upload
 * Not allowed - only POST uploads are supported
 */
export async function GET() {
  return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
}
