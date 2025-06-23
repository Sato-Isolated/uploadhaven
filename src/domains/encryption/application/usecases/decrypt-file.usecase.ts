/**
 * 🔐 Decrypt File Use Case (Zero-Knowledge)
 * 
 * Handles client-side file decryption with privacy guarantees.
 * Ensures decryption happens only on client-side.
 */

import { EncryptedFile } from '../../domain/entities/encrypted-file.entity';
import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { InitializationVector } from '../../domain/value-objects/InitializationVector';
import { IEncryptionService } from '../../domain/services/IEncryptionService';

export interface DecryptionResult {
  file: File;
  metadata: {
    originalSize: number;
    algorithm: string;
    timestamp: Date;
  };
}

export interface DecryptFileRequest {
  encryptedFile: EncryptedFile;
  encryptionKey: EncryptionKey;
}

export interface DecryptFileFromUrlRequest {
  shareUrl: string;
  encryptedBlob: Uint8Array;
  iv: Uint8Array;
  metadata: {
    originalSize: number;
    algorithm: string;
    timestamp: Date;
  };
}

export class DecryptFileUseCase {
  constructor(
    private readonly encryptionService: IEncryptionService
  ) { }
  /**
   * Decrypt file using existing EncryptedFile entity and key
   */
  async execute(request: DecryptFileRequest): Promise<DecryptionResult> {
    // Validate inputs
    this.validateDecryptionRequest(request);    // Extract primitives from domain entities
    const encryptedData = request.encryptedFile.encryptedBlob;
    const iv = InitializationVector.fromBytes(request.encryptedFile.iv);

    // Decrypt file using primitive interface (client-side only)
    const decryptedResult = await this.encryptionService.decryptFile(
      encryptedData,
      request.encryptionKey,
      iv
    );

    // Create File object from decrypted data
    const file = new File(
      [decryptedResult.fileData],
      decryptedResult.metadata.filename,
      { type: decryptedResult.metadata.mimeType }
    );

    return {
      file,
      metadata: {
        originalSize: decryptedResult.metadata.size,
        algorithm: request.encryptedFile.algorithm,
        timestamp: request.encryptedFile.timestamp
      }
    };
  }

  /**
   * Decrypt file from share URL (extract key from fragment)
   */
  async executeFromShareUrl(request: DecryptFileFromUrlRequest): Promise<DecryptionResult> {
    // Extract encryption key from URL fragment
    const encryptionKey = this.extractKeyFromShareUrl(request.shareUrl);
    if (!encryptionKey) {
      throw new DecryptionError('Invalid share URL: encryption key not found in URL fragment');
    }

    // Reconstruct EncryptedFile entity
    const fileId = this.extractFileIdFromShareUrl(request.shareUrl);
    const encryptedFile = EncryptedFile.create(
      fileId,
      request.encryptedBlob,
      request.iv,
      {
        originalSize: request.metadata.originalSize,
        encryptedSize: request.encryptedBlob.length,
        algorithm: request.metadata.algorithm as 'AES-256-GCM',
        timestamp: request.metadata.timestamp
      }
    );

    // Decrypt using standard flow
    return this.execute({
      encryptedFile,
      encryptionKey
    });
  }

  private validateDecryptionRequest(request: DecryptFileRequest): void {
    if (!request.encryptedFile) {
      throw new DecryptionError('Encrypted file is required');
    }

    if (!request.encryptionKey) {
      throw new DecryptionError('Encryption key is required');
    }

    if (request.encryptedFile.encryptedSize === 0) {
      throw new DecryptionError('Encrypted file cannot be empty');
    }
  }

  private extractKeyFromShareUrl(shareUrl: string): EncryptionKey | null {
    try {
      const fragmentIndex = shareUrl.indexOf('#');
      if (fragmentIndex === -1) {
        return null;
      }

      const keyBase64 = shareUrl.substring(fragmentIndex + 1);
      if (!keyBase64) {
        return null;
      }

      return EncryptionKey.fromBase64(keyBase64);
    } catch (error) {
      console.warn('Failed to extract encryption key from share URL:', error);
      return null;
    }
  }
  private extractFileIdFromShareUrl(shareUrl: string): string {
    try {
      // Remove fragment part
      const baseUrl = shareUrl.split('#')[0];

      // Extract file ID from URL path
      // Expected format: https://uploadhaven.dev/s/fileId
      const pathParts = baseUrl.split('/');
      const fileId = pathParts[pathParts.length - 1];

      if (!fileId) {
        throw new Error('File ID not found in URL');
      }

      return fileId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DecryptionError(`Invalid share URL format: ${errorMessage}`);
    }
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}
