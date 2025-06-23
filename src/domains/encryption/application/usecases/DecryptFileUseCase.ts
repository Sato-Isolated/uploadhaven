import { UseCase } from '../../../../shared/domain/types';
import { IEncryptionService } from '../../domain/services/IEncryptionService';
import { IEncryptedFileRepository } from '../../domain/repositories/IEncryptedFileRepository';
import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';

/**
 * Use case for decrypting files with zero-knowledge guarantees
 * 
 * PRIVACY GUARANTEES:
 * - Decryption performed client-side only
 * - Server provides encrypted blob without decryption capability
 * - Encryption keys never sent to server
 */

export interface DecryptFileRequest {
  fileId: string;
  encryptionKey: EncryptionKey;
  password?: string; // For password-protected files
}

export interface DecryptFileResponse {
  fileData: Uint8Array;
  metadata: {
    filename: string;
    mimeType: string;
    originalSize: number;
    uploadedAt: Date;
  };
  downloadInfo: {
    remainingDownloads: number;
    expiresAt: Date;
    timeUntilExpiration: number; // milliseconds
  };
}

export class DecryptFileUseCase implements UseCase<DecryptFileRequest, DecryptFileResponse> {
  constructor(
    private readonly encryptionService: IEncryptionService,
    private readonly fileRepository: IEncryptedFileRepository
  ) { }

  async execute(request: DecryptFileRequest): Promise<DecryptFileResponse> {
    // Validate request
    this.validateRequest(request);

    // Retrieve encrypted file from repository
    const encryptedFile = await this.fileRepository.findById(request.fileId);

    if (!encryptedFile) {
      throw new Error('File not found or has expired');
    }

    // Check if file is available for download
    if (!encryptedFile.isAvailableForDownload()) {
      if (encryptedFile.isExpired()) {
        throw new Error('File has expired and is no longer available');
      }
      if (encryptedFile.hasReachedDownloadLimit()) {
        throw new Error('File has reached its download limit');
      }
    }

    // Record the download attempt
    const updatedFile = await this.fileRepository.incrementDownloadCount(request.fileId);
    if (!updatedFile) {
      throw new Error('Failed to record download attempt');
    }

    // Decrypt the file client-side
    const decryptionResult = await this.encryptionService.decryptFile(
      encryptedFile.encryptedBlob,
      request.encryptionKey,
      encryptedFile.iv
    );

    // Prepare response
    return {
      fileData: decryptionResult.fileData,
      metadata: {
        filename: decryptionResult.metadata.filename,
        mimeType: decryptionResult.metadata.mimeType,
        originalSize: decryptionResult.metadata.size,
        uploadedAt: encryptedFile.uploadedAt,
      },
      downloadInfo: {
        remainingDownloads: updatedFile.getRemainingDownloads(),
        expiresAt: updatedFile.expiresAt,
        timeUntilExpiration: updatedFile.getTimeUntilExpiration(),
      }
    };
  }

  private validateRequest(request: DecryptFileRequest): void {
    if (!request.fileId) {
      throw new Error('File ID is required');
    }

    if (!request.encryptionKey) {
      throw new Error('Encryption key is required');
    }

    // Validate file ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(request.fileId)) {
      throw new Error('Invalid file ID format');
    }
  }
}
