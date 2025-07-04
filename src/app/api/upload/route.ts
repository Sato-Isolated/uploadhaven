import { NextRequest, NextResponse } from 'next/server';
import '@/lib/server-startup'; // Initialize server-side tasks
import { serverPerformanceMonitor } from '@/lib/performance/server-performance-monitor';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { WebCryptoService } from '@/domains/security/web-crypto-service';
import { FileApplicationService } from '@/application/file-application-service';
import { CommandFactory } from '@/application/commands';
import { ConfigurationService, DEFAULT_CONFIGURATION } from '@/domains/shared/configuration';
import { rateLimiter } from '@/lib/cache';
import { auth } from '@/lib/auth';
import mime from 'mime-types';

export async function POST(request: NextRequest) {
  return serverPerformanceMonitor.measureApiOperation('upload', async () => {
    try {
      // Check authentication (optional - anonymous uploads are allowed)
      let userId: string | undefined;
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });
        userId = session?.user?.id;
      } catch {
        // Silent fail - anonymous uploads are allowed
        userId = undefined;
      }

      // Get client metadata
      const clientIP = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Rate limiting by IP (more lenient for authenticated users)
      const rateLimitKey = userId ? `upload:user:${userId}` : `upload:ip:${clientIP}`;
      const uploadLimit = userId ? 20 : 10; // Authenticated users get higher limit
      const { allowed, remaining, resetTime } = rateLimiter.check(rateLimitKey, uploadLimit, 60000);

      if (!allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Too many uploads.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toString(),
            }
          }
        );
      }

      // Parse form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const originalName = formData.get('originalName') as string;
      let mimeType = formData.get('mimeType') as string;
      const expirationHours = formData.get('expirationHours') ? Number(formData.get('expirationHours')) : undefined;
      const maxDownloads = formData.get('maxDownloads') ? Number(formData.get('maxDownloads')) : undefined;
      const passwordProtected = formData.get('passwordProtected') === 'true';
      const password: string | undefined = formData.get('password') as string | null || undefined;

      // Use mime-types library for proper MIME type detection
      if (!mimeType || mimeType === 'application/octet-stream') {
        mimeType = mime.lookup(originalName) || 'application/octet-stream';
      }

      // Validate required fields
      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 });
      }

      if (!originalName) {
        return NextResponse.json({ error: 'Original name is required' }, { status: 400 });
      }

      if (passwordProtected && !password) {
        return NextResponse.json({ error: 'Password is required when password protection is enabled' }, { status: 400 });
      }

      // Initialize services
      const fileRepository = new MongoFileRepository();
      const shareRepository = new MongoShareRepository();
      const storageService = new DiskStorageService();
      const cryptoService = new WebCryptoService();
      const configService = new ConfigurationService(DEFAULT_CONFIGURATION);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      // Initialize application service
      const fileAppService = new FileApplicationService(
        fileRepository,
        shareRepository,
        storageService,
        cryptoService,
        configService,
        baseUrl
      );

      // Create upload command
      const uploadCommand = CommandFactory.uploadFile({
        file,
        expirationHours,
        maxDownloads,
        password,
        metadata: {
          userAgent,
          ipAddress: clientIP,
          userId // Include userId if authenticated
        }
      });

      // Execute upload via application service
      const result = await fileAppService.uploadFile(uploadCommand);

      if (!result.success) {
        const statusCode = result.error?.code === 'VALIDATION_ERROR' ? 400 : 
                          result.error?.code === 'FEATURE_DISABLED' ? 503 : 500;
        
        return NextResponse.json(
          { 
            error: result.error?.message || 'Upload failed',
            code: result.error?.code,
            details: result.error?.details
          },
          { status: statusCode }
        );
      }

      // Return success response
      const response = NextResponse.json(result.data);

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', '10');
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', resetTime.toString());

      return response;

    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
