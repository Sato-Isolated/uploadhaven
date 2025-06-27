import { NextRequest, NextResponse } from 'next/server';
import { serverPerformanceMonitor } from '@/lib/performance/server-performance-monitor';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { PasswordService } from '@/lib/password-service';
import { FileNotFoundError, FileExpiredError, MaxDownloadsReachedError } from '@/domains/file/file-repository';

export async function POST(request: NextRequest) {
  return serverPerformanceMonitor.measureApiOperation('download', async () => {
    try {
      const { fileId, password } = await request.json();

      if (!fileId) {
        return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
      }

      // Initialize services
      const fileRepository = new MongoFileRepository();
      const storageService = new DiskStorageService();

      // Find file with performance monitoring
      const file = await serverPerformanceMonitor.measureDbOperation('file-find', () =>
        fileRepository.findById(fileId)
      );
      
      if (!file) {
        throw new FileNotFoundError(fileId);
      }

      // Check if file has expired
      if (file.isExpired()) {
        throw new FileExpiredError(fileId);
      }

      // Check if max downloads reached
      if (file.hasReachedMaxDownloads()) {
        throw new MaxDownloadsReachedError(fileId);
      }

      // Check password if file is protected
      if (file.isPasswordProtected()) {
        if (!password) {
          return NextResponse.json({ error: 'Password required' }, { status: 401 });
        }

        const isPasswordValid = await PasswordService.verify(password, file.passwordHash!);
        if (!isPasswordValid) {
          return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
      }

      // Read encrypted file from storage (already encrypted by client)
      const encryptedData = await storageService.read(file.encryptedPath);

      // Increment download count with performance monitoring
      await serverPerformanceMonitor.measureDbOperation('download-count-increment', () =>
        fileRepository.incrementDownloadCount(file.id)
      );

      // Return encrypted data as base64 for client-side decryption
      const buffer = Buffer.from(encryptedData);
      const base64Content = buffer.toString('base64');

      return NextResponse.json({
        fileName: file.originalName,
        mimeType: file.mimeType,
        content: base64Content,
      });
    } catch (error: unknown) {
      console.error('Download error:', error);
      
      // Handle specific file errors with appropriate HTTP status codes
      if (error instanceof FileNotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      
      if (error instanceof FileExpiredError) {
        return NextResponse.json({ error: error.message }, { status: 410 }); // Gone
      }
      
      if (error instanceof MaxDownloadsReachedError) {
        return NextResponse.json({ error: error.message }, { status: 403 }); // Forbidden
      }
      
      // Handle other errors
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  });
}
