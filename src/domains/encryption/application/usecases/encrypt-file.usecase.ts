/**
 * 🔐 Encrypt File Use Case (Zero-Knowledge)
 * 
 * Handles client-side file encryption with privacy guarantees.
 * Ensures encryption keys never leave the client.
 */

import { EncryptedFile } from '../../domain/entities/encrypted-file.entity';
import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { IEncryptionService } from '../../domain/services/IEncryptionService';
import { FileId } from '../../../file-sharing/domain/value-objects/file-id.vo';

export interface EncryptFileRequest {
  file: File;
  password?: string;
  baseUrl: string;
}

export interface EncryptFileResponse {
  encryptedFile: EncryptedFile;
  shareUrl: string;
}

/**
 * Error thrown when file encryption validation fails
 */
export class EncryptionValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Encryption validation failed: ${errors.join(', ')}`);
    this.name = 'EncryptionValidationError';
  }
}

/**
 * Use case for encrypting files with zero-knowledge patterns
 */
export class EncryptFileUseCase {
  constructor(private readonly encryptionService: IEncryptionService) { }
  /**
   * Execute file encryption
   */
  async execute(request: EncryptFileRequest): Promise<EncryptFileResponse> {
    // 1. Validate request
    this.validateFile(request.file);

    // 2. Generate or derive encryption key (NEVER stored on server)
    const encryptionKey = request.password
      ? (await this.encryptionService.deriveKeyFromPassword(
        request.password,
        this.encryptionService.generateSalt()
      )).key
      : this.encryptionService.generateKey();

    // 3. Encrypt file with AES-256-GCM (client-side only)
    const encryptionResult = await this.encryptionService.encryptFile(
      request.file,
      encryptionKey
    );

    // 4. Create EncryptedFile entity using the correct interface
    const encryptedFile = EncryptedFile.create(
      FileId.generate().value, // Generate proper file ID
      encryptionResult.encryptedData,
      encryptionResult.iv.getBytes(),
      {
        originalSize: encryptionResult.originalMetadata.size,
        encryptedSize: encryptionResult.encryptedData.length,
        algorithm: 'AES-256-GCM',
        mimeType: encryptionResult.originalMetadata.mimeType,
        filename: encryptionResult.originalMetadata.filename,
        timestamp: new Date()
      }
    );

    // 5. Generate share URL with key in fragment (never sent to server)
    const shareUrl = this.generateShareUrl(
      request.baseUrl,
      encryptedFile.id,
      encryptionKey
    );

    return {
      encryptedFile,
      shareUrl
    };
  }
  /**
   * Validate file for encryption
   */
  private validateFile(file: File): void {
    const errors: string[] = [];

    if (!file) {
      errors.push('File is required');
    } else {
      // Only validate properties if file exists
      if (file.size === 0) {
        errors.push('File cannot be empty');
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        errors.push('File too large (maximum 100MB)');
      }
    }

    if (errors.length > 0) {
      throw new EncryptionValidationError(errors);
    }
  }

  /**
   * Generate share URL with key in fragment
   * 
   * @param baseUrl - Base URL (e.g., "https://uploadhaven.dev")
   * @param fileId - Public file identifier
   * @param encryptionKey - Encryption key (goes in URL fragment)
   * @returns Share URL with key in fragment
   */  private generateShareUrl(
    baseUrl: string,
    fileId: string,
    encryptionKey: EncryptionKey
  ): string {
    // Key goes in URL fragment - never sent to server
    return `${baseUrl}/s/${fileId}#${encryptionKey.toBase64Url()}`;
  }
}
