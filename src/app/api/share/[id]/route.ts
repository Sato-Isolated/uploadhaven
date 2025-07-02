import { NextRequest, NextResponse } from 'next/server';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { WebCryptoService } from '@/domains/security/web-crypto-service';
import { FileApplicationService } from '@/application/file-application-service';
import { QueryFactory } from '@/application/commands';
import { ConfigurationService, DEFAULT_CONFIGURATION } from '@/domains/shared/configuration';
import { getCacheKey, rateLimiter, withCache } from '@/lib/cache';
import { ShareNotFoundError, FileNotFoundError } from '@/domains/shared';

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
      const fileRepository = new MongoFileRepository();
      const shareRepository = new MongoShareRepository();
      const storageService = new DiskStorageService();
      const cryptoService = new WebCryptoService();
      const configService = new ConfigurationService(DEFAULT_CONFIGURATION);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      const fileAppService = new FileApplicationService(
        fileRepository,
        shareRepository,
        storageService,
        cryptoService,
        configService,
        baseUrl
      );

      // Find share
      const share = await shareRepository.findById(shareId);
      if (!share) {
        throw new ShareNotFoundError(shareId);
      }

      // Check if share can be accessed
      if (!share.canBeAccessed()) {
        const reason = share.isExpired() ? 'Share has expired' : 'Share access limit reached';
        throw new Error(reason);
      }

      // Get file info
      const file = await fileRepository.findById(share.fileId);
      if (!file) {
        throw new FileNotFoundError(share.fileId);
      }

      // Return combined info (no sensitive data)
      return {
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        uploadedAt: file.uploadedAt,
        expiresAt: file.expiresAt,
        downloadCount: file.downloadCount,
        maxDownloads: file.maxDownloads,
        canBeDownloaded: file.canBeAccessed(),
        passwordProtected: file.isPasswordProtected(),
        shareInfo: {
          id: share.id,
          shareUrl: share.shareUrl,
          expiresAt: share.expiresAt,
          accessCount: share.accessCount,
          maxAccess: share.maxAccess,
          canBeAccessed: share.canBeAccessed()
        }
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

    // Handle access errors
    if (error instanceof Error && (
      error.message.includes('expired') || 
      error.message.includes('access limit')
    )) {
      return NextResponse.json({ error: error.message }, { status: 410 }); // Gone
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage || 'Internal server error' },
      { status: 500 }
    );
  }
}
