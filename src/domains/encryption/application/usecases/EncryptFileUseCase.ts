import { UseCase } from '../../../../shared/domain/types';
import { IEncryptionService } from '../../domain/services/IEncryptionService';
import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { EncryptedFile } from '../../domain/entities/EncryptedFile';

/**
 * Use case for encrypting files with zero-knowledge guarantees
 * 
 * PRIVACY GUARANTEES:
 * - All encryption operations performed client-side only
 * - Encryption keys never leave the client
 * - Server receives only encrypted blob and public metadata
 */

export interface EncryptFileRequest {
  file: File;
  password?: string; // Optional password protection
  expirationHours?: number; // Default 24 hours
  maxDownloads?: number; // Default 10
}

export interface EncryptFileResponse {
  encryptedFile: EncryptedFile;
  encryptionKey: EncryptionKey;
  shareUrlBase: string; // Without key fragment
  keyForUrl: string; // Base64 key for URL fragment
  metadata: {
    originalFilename: string;
    originalSize: number;
    encryptedSize: number;
    algorithm: string;
    expiresAt: Date;
    maxDownloads: number;
  };
}

export class EncryptFileUseCase implements UseCase<EncryptFileRequest, EncryptFileResponse> {
  constructor(
    private readonly encryptionService: IEncryptionService,
    private readonly baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
  ) { }

  async execute(request: EncryptFileRequest): Promise<EncryptFileResponse> {
    // Validate request
    this.validateRequest(request);    // Generate or derive encryption key
    const { key } = await this.generateEncryptionKey(request.password);

    // Encrypt the file
    const encryptionResult = await this.encryptionService.encryptFile(request.file, key);

    // Calculate expiration date
    const expirationHours = request.expirationHours || 24;
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    // Create encrypted file entity
    const encryptedFile = EncryptedFile.create(
      encryptionResult.encryptedData,
      encryptionResult.iv,
      expiresAt,
      request.maxDownloads || 10
    );

    // Generate share URL base (without key)
    const shareUrlBase = encryptedFile.generateShareUrl(this.baseUrl);

    // Prepare response
    return {
      encryptedFile,
      encryptionKey: key,
      shareUrlBase,
      keyForUrl: key.toBase64(),
      metadata: {
        originalFilename: encryptionResult.originalMetadata.filename,
        originalSize: encryptionResult.originalMetadata.size,
        encryptedSize: encryptionResult.encryptedData.length,
        algorithm: 'AES-256-GCM',
        expiresAt,
        maxDownloads: request.maxDownloads || 10,
      }
    };
  }

  private validateRequest(request: EncryptFileRequest): void {
    if (!request.file) {
      throw new Error('File is required');
    }

    if (request.file.size === 0) {
      throw new Error('File cannot be empty');
    }

    // Anonymous upload size limit: 100MB
    const maxSize = 100 * 1024 * 1024;
    if (request.file.size > maxSize) {
      throw new Error(`File size cannot exceed ${maxSize / (1024 * 1024)}MB for anonymous uploads`);
    } if (request.expirationHours !== undefined && (request.expirationHours < 1 || request.expirationHours > 168)) {
      throw new Error('Expiration hours must be between 1 and 168');
    }

    if (request.maxDownloads !== undefined && (request.maxDownloads < 1 || request.maxDownloads > 1000)) {
      throw new Error('Max downloads must be between 1 and 1000');
    }

    if (request.password && request.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
  }

  private async generateEncryptionKey(password?: string): Promise<{ key: EncryptionKey; salt?: Uint8Array }> {
    if (password) {
      // Password-based key derivation
      const salt = this.encryptionService.generateSalt();
      const { key } = await this.encryptionService.deriveKeyFromPassword(password, salt);
      return { key, salt };
    } else {
      // Random key generation
      const key = this.encryptionService.generateKey();
      return { key };
    }
  }
}
