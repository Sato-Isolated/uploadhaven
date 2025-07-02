import { NextRequest, NextResponse } from 'next/server';
import { serverPerformanceMonitor } from '@/lib/performance/server-performance-monitor';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { WebCryptoService } from '@/domains/security/web-crypto-service';
import { FileApplicationService } from '@/application/file-application-service';
import { CommandFactory } from '@/application/commands';
import { ConfigurationService, DEFAULT_CONFIGURATION } from '@/domains/shared/configuration';

export async function POST(request: NextRequest) {
  return serverPerformanceMonitor.measureApiOperation('download', async () => {
    try {
      // Get client metadata
      const clientIP = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Parse request body
      const { fileId, password } = await request.json();

      if (!fileId) {
        return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
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

      // Create download command
      const downloadCommand = CommandFactory.downloadFile({
        fileId,
        password,
        metadata: {
          userAgent,
          ipAddress: clientIP
        }
      });

      // Execute download via application service
      const result = await fileAppService.downloadFile(downloadCommand);

      if (!result.success) {
        const statusCode = result.error?.code === 'FILE_NOT_FOUND' ? 404 :
                          result.error?.code === 'FILE_NOT_ACCESSIBLE' ? 410 :
                          result.error?.code === 'VALIDATION_ERROR' ? 401 : 500;
        
        return NextResponse.json(
          { 
            error: result.error?.message || 'Download failed',
            code: result.error?.code
          },
          { status: statusCode }
        );
      }

      // Convert ArrayBuffer to base64 for JSON response
      const buffer = Buffer.from(result.data!.content);
      const base64Content = buffer.toString('base64');

      return NextResponse.json({
        fileName: result.data!.fileName,
        mimeType: result.data!.mimeType,
        content: base64Content,
      });

    } catch (error) {
      console.error('Download error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
