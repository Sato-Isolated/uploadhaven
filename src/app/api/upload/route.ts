import { NextRequest, NextResponse } from 'next/server';
import '@/lib/server-startup'; // Initialize server-side tasks
import { serverPerformanceMonitor } from '@/lib/performance/server-performance-monitor';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { FileEntity } from '@/domains/file/file-entity';
import { ShareEntity } from '@/domains/share/share-entity';
import { PasswordService } from '@/lib/password-service';
import { rateLimiter } from '@/lib/cache';

export async function POST(request: NextRequest) {
  return serverPerformanceMonitor.measureApiOperation('upload', async () => {
    try {
      // Rate limiting by IP
      const clientIP = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      const rateLimitKey = `upload:${clientIP}`;
      const { allowed, remaining, resetTime } = rateLimiter.check(rateLimitKey, 10, 60000); // 10 uploads per minute
      
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

      const formData = await request.formData();
      const file = formData.get('file') as File;
      const originalName = formData.get('originalName') as string;
      const mimeType = formData.get('mimeType') as string;
      const size = Number(formData.get('size'));
      const expirationHours = Number(formData.get('expirationHours')) || 24;
      const maxDownloads = formData.get('maxDownloads') 
        ? Number(formData.get('maxDownloads')) 
        : undefined;
      const passwordProtected = formData.get('passwordProtected') === 'true';
      const password = formData.get('password') as string;

      if (!file || !originalName || !mimeType) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Validate and hash password if provided
      let passwordHash: string | undefined;
      if (passwordProtected && password) {
        const validation = PasswordService.validatePassword(password);
        if (!validation.isValid) {
          return NextResponse.json({ 
            error: `Password validation failed: ${validation.errors.join(', ')}` 
          }, { status: 400 });
        }
        passwordHash = await PasswordService.hash(password);
      } else if (passwordProtected && !password) {
        return NextResponse.json({ 
          error: 'Password is required when password protection is enabled' 
        }, { status: 400 });
      }

      // Initialize services
      const fileRepository = new MongoFileRepository();
      const shareRepository = new MongoShareRepository();
      const storageService = new DiskStorageService();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      // File is already encrypted on client side, just store it
      const fileBuffer = await file.arrayBuffer();
      
      // Create file entity
      const fileEntity = FileEntity.create({
        originalName,
        mimeType,
        size, // Original file size, not encrypted size
        encryptedPath: '', // Will be set after storage
        expirationHours,
        maxDownloads,
        passwordHash, // Store password hash
      });

      // Generate storage path and save encrypted file with performance monitoring
      const storagePath = storageService.generatePath(fileEntity.id);
      await serverPerformanceMonitor.measureUpload(
        () => storageService.save(fileBuffer, storagePath),
        size
      );
      
      // Update file entity with storage path
      const updatedFileEntity = fileEntity.updateEncryptedPath(storagePath);

      // Save to database with performance monitoring
      await serverPerformanceMonitor.measureDbOperation('file-save', () => 
        fileRepository.save(updatedFileEntity)
      );

      // Create share entity
      const shareEntity = ShareEntity.create({
        fileId: updatedFileEntity.id,
        baseUrl,
        expirationHours,
        passwordProtected,
      });

      await serverPerformanceMonitor.measureDbOperation('share-save', () => 
        shareRepository.save(shareEntity)
      );

      const response = NextResponse.json({
        fileId: updatedFileEntity.id,
        shareUrl: shareEntity.shareUrl,
        expiresAt: updatedFileEntity.expiresAt,
      });

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
