/**
 * DownloadFile Use Case - Secure file download with zero-knowledge decryption
 * 
 * Orchestrates the secure file download process:
 * 1. Retrieve encrypted file from storage
 * 2. Validate access permissions and limits
 * 3. Return encrypted blob for client-side decryption
 * 4. Update download statistics
 * 
 * @domain file-sharing
 * @pattern Use Case (DDD)
 * @privacy zero-knowledge - server never sees decryption keys or plaintext
 */

import { IFileRepository } from '../interfaces/file.repository.interface';
import { FileId } from '../../domain/value-objects/file-id.vo';

/**
 * Request for file download
 */
export interface DownloadFileRequest {
  readonly fileId: string;
  // Note: encryption key is NOT included here - it stays client-side only
}

/**
 * Response for file download
 */
export interface DownloadFileResponse {
  readonly fileId: string;
  readonly encryptedBlob: Uint8Array;
  readonly iv: string; // Public initialization vector
  readonly size: number;
  readonly expiresAt: Date;
  readonly remainingDownloads: number;
  readonly downloadCount: number;
}

/**
 * File download use case
 * 
 * This use case handles:
 * - Secure file retrieval from storage
 * - Access validation and download limits
 * - Download statistics tracking
 * - Privacy-safe error handling
 * 
 * Note: Decryption happens client-side using DecryptFileUseCase
 */
export class DownloadFileUseCase {
  constructor(
    private readonly fileRepository: IFileRepository
  ) { }

  /**
   * Execute file download
   * 
   * @param request - Download request with file ID
   * @returns Promise<DownloadFileResponse>
   * @throws Error if file not found, expired, or download limit exceeded
   */
  async execute(request: DownloadFileRequest): Promise<DownloadFileResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Find file by ID
      const fileId = FileId.fromString(request.fileId);
      const sharedFile = await this.fileRepository.findById(fileId);

      if (!sharedFile) {
        throw new Error('File not found or no longer available');
      }

      // 3. Validate file availability
      this.validateFileAvailability(sharedFile);

      // 4. Record download attempt
      sharedFile.recordDownload();

      // 5. Update file in repository
      await this.fileRepository.update(sharedFile);

      // 6. Return encrypted blob for client-side decryption
      return {
        fileId: sharedFile.id,
        encryptedBlob: sharedFile.encryptedBlob,
        iv: sharedFile.iv,
        size: sharedFile.size,
        expiresAt: sharedFile.expiresAt,
        remainingDownloads: sharedFile.remainingDownloads,
        downloadCount: sharedFile.downloadCount,
      };

    } catch (error) {
      // Log error without sensitive data
      console.error('File download failed:', {
        fileId: request.fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      // Return user-friendly error message
      if (error instanceof Error) {
        throw error; // Re-throw known errors
      }

      throw new Error('Download failed. Please check the link and try again.');
    }
  }

  /**
   * Get file metadata without downloading
   * Used for file info API endpoints
   */
  async getFileInfo(request: DownloadFileRequest): Promise<{
    fileId: string;
    size: number;
    expiresAt: Date;
    remainingDownloads: number;
    isAvailable: boolean;
  }> {
    try {
      this.validateRequest(request);

      const fileId = FileId.fromString(request.fileId);
      const metadata = await this.fileRepository.getMetadata(fileId);

      if (!metadata) {
        throw new Error('File not found or no longer available');
      }

      return {
        fileId: request.fileId,
        size: metadata.size,
        expiresAt: metadata.expiresAt,
        remainingDownloads: metadata.remainingDownloads,
        isAvailable: metadata.isAvailable,
      };

    } catch (error) {
      console.error('File info retrieval failed:', {
        fileId: request.fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error('Unable to retrieve file information');
    }
  }

  /**
   * Validate download request
   */
  private validateRequest(request: DownloadFileRequest): void {
    if (!request.fileId) {
      throw new Error('File ID is required');
    }

    if (typeof request.fileId !== 'string') {
      throw new Error('File ID must be a string');
    }

    if (request.fileId.length !== 10) {
      throw new Error('Invalid file ID format');
    }

    const validCharPattern = /^[A-Za-z0-9\-_]{10}$/;
    if (!validCharPattern.test(request.fileId)) {
      throw new Error('Invalid file ID format');
    }
  }

  /**
   * Validate file availability for download
   */
  private validateFileAvailability(sharedFile: any): void {
    if (sharedFile.isDeleted) {
      throw new Error('File has been deleted');
    }

    if (sharedFile.isExpired) {
      throw new Error('File has expired');
    }

    if (sharedFile.remainingDownloads <= 0) {
      throw new Error('Download limit exceeded');
    }

    if (!sharedFile.isAvailable) {
      throw new Error('File is not available for download');
    }
  }
}
