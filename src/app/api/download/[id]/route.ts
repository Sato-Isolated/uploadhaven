/**
 * Download API Endpoint - Zero-Knowledge File Download
 * 
 * GET /api/download/[id]
 *
 * Zero-Knowledge file download endpoint (DDD Architecture).
 * Uses DownloadFileUseCase from file-sharing domain.
 * The server returns encrypted blobs - decryption happens client-side.
 * 
 * @architecture DDD - Uses domain services and use cases
 * @privacy Zero-Knowledge - Server cannot decrypt files
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DomainContainer } from '@/shared/infrastructure/di/domain-container';

// Validation schema for download request
const downloadRequestSchema = z.object({
  id: z.string().min(1, 'File ID is required')
});

/**
 * Create error response
 */
function createErrorResponse(message: string, code: string, status: number) {
  return NextResponse.json({
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    }
  }, { status });
}

/**
 * Create success response
 */
function createSuccessResponse(data: any) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/download/[id] - Download encrypted file
 * 
 * Returns encrypted blob for client-side decryption.
 * Server never has access to decryption keys or plaintext.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let fileId: string = 'unknown';
  
  try {
    // Await params as required by Next.js 15
    const paramData = await params;
    fileId = paramData.id;
    
    // Validate file ID parameter
    const validation = downloadRequestSchema.safeParse({ id: fileId });

    if (!validation.success) {
      return createErrorResponse(
        validation.error.issues[0].message,
        'VALIDATION_ERROR',
        400
      );
    }

    // Get domain container and use case
    const domainContainer = DomainContainer.getInstance();
    await domainContainer.waitForInitialization();
    const downloadUseCase = await domainContainer.getDownloadFileUseCase();

    // Execute the download use case
    const downloadResult = await downloadUseCase.execute({ fileId });

    console.log('📥 File download successful:', {
      fileId: downloadResult.fileId,
      size: downloadResult.size,
      remainingDownloads: downloadResult.remainingDownloads,
      downloadCount: downloadResult.downloadCount
    });

    return createSuccessResponse({
      fileId: downloadResult.fileId,
      encryptedBlob: Array.from(downloadResult.encryptedBlob), // Convert Uint8Array to array for JSON
      iv: downloadResult.iv,
      size: downloadResult.size,
      expiresAt: downloadResult.expiresAt,
      remainingDownloads: downloadResult.remainingDownloads,
      downloadCount: downloadResult.downloadCount,
    });
  } catch (error) {
    console.error('❌ Download API error:', {
      fileId: fileId, // Use the extracted fileId variable
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly error
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createErrorResponse(
          'File not found or no longer available',
          'FILE_NOT_FOUND',
          404
        );
      }
      
      if (error.message.includes('expired')) {
        return createErrorResponse(
          'File has expired and is no longer available',
          'FILE_EXPIRED',
          410
        );
      }

      if (error.message.includes('download limit')) {
        return createErrorResponse(
          'Download limit exceeded',
          'DOWNLOAD_LIMIT_EXCEEDED',
          403
        );
      }
    }

    return createErrorResponse(
      'Download failed. Please try again.',
      'DOWNLOAD_ERROR',
      500
    );
  }
}
