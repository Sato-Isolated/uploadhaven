import { NextRequest, NextResponse } from 'next/server';
import { FileService } from '@/application/file-service';
import { FileRepository } from '@/infrastructure/database/mongo-file-repository';
import { ShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { WebCryptoService } from '@/domains/security/web-crypto-service';
import { getCacheKey, rateLimiter, withCache } from '@/lib/cache';
import { FileNotFoundError } from '@/domains/file/file-repository';
import { ShareNotFoundError } from '@/domains/share/share-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;

    // Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitKey = `share-info:${clientIP}`;
    const { allowed, remaining, resetTime } = rateLimiter.check(rateLimitKey, 100, 60000); // 100 requests per minute

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
          }
        }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey('share-info', shareId);

    const result = await withCache(cacheKey, async () => {
      // Initialize services
      const fileRepository = new FileRepository();
      const shareRepository = new ShareRepository();
      const storageService = new DiskStorageService();
      const cryptoService = new WebCryptoService();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      const fileService = new FileService(
        fileRepository,
        shareRepository,
        storageService,
        cryptoService,
        baseUrl
      );

      // Find share
      const share = await shareRepository.findById(shareId);
      if (!share) {
        throw new ShareNotFoundError(shareId);
      }

      // Get file directly to access password protection info
      const file = await fileRepository.findById(share.fileId);
      if (!file) {
        throw new FileNotFoundError(share.fileId);
      }

      // Get file info
      const fileInfo = await fileService.getFileInfo(share.fileId);

      // Return combined info
      return {
        ...fileInfo,
        passwordProtected: file.isPasswordProtected(),
      };
    }, 30000); // Cache for 30 seconds

    const response = NextResponse.json(result);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');

    return response;
  } catch (error: unknown) {
    console.error('Share info error:', error);

    // Handle specific errors with appropriate HTTP status codes
    if (error instanceof ShareNotFoundError || error instanceof FileNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage || 'Internal server error' },
      { status: 500 }
    );
  }
}
