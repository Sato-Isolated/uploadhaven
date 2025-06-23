/**
 * UploadAnonymous Use Case - Anonymous file upload with zero-knowledge encryption
 * 
 * Orchestrates the anonymous file upload process:
 * 1. Accept already-encrypted data from client (zero-knowledge)
 * 2. Secure storage of encrypted blob
 * 3. Generation of sharing URL with key in fragment
 * 
 * @domain file-sharing
 * @pattern Use Case (DDD)
 * @privacy zero-knowledge - server never sees encryption keys or plaintext
 */

import { IFileRepository } from '../interfaces/file.repository.interface';
import { SharedFile } from '../../domain/entities/shared-file.entity';

/**
 * Request for anonymous file upload with already-encrypted data
 */
export interface UploadAnonymousRequest {
  readonly encryptedData: ArrayBuffer; // Already encrypted by client
  readonly metadata: {
    readonly size: number;
    readonly algorithm: string;
    readonly iv: string;
    readonly salt: string;
    readonly iterations: number;
  };  readonly ttlHours?: number; // Default: 24 hours
  readonly maxDownloads?: number; // Optional: undefined = unlimited downloads
  readonly isPasswordProtected?: boolean; // Whether client used a password
}

/**
 * Response from anonymous file upload
 */
export interface UploadAnonymousResponse {
  readonly fileId: string;
  readonly shareUrl: string;
  readonly expiresAt: Date;
  readonly maxDownloads: number | null; // null means unlimited
  readonly size: number;
  readonly isPasswordProtected: boolean;
}

/**
 * Anonymous file upload use case for already-encrypted data
 * 
 * This use case coordinates:
 * - Accepting already-encrypted data (client-side encryption only)
 * - Secure file storage (via IFileRepository)
 * - Share URL generation with key isolation
 * - Privacy-safe response generation
 */
export class UploadAnonymousUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly baseUrl: string // e.g., "https://uploadhaven.dev"
  ) { }

  /**
   * Execute anonymous file upload with already-encrypted data
   * 
   * @param request - Upload request with encrypted data and options
   * @returns Promise<UploadAnonymousResponse>
   * @throws Error if upload fails or validation fails
   */
  async execute(request: UploadAnonymousRequest): Promise<UploadAnonymousResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);      // 2. Create shared file entity with already-encrypted data
      const sharedFile = await SharedFile.createFromEncryptedData(
        request.encryptedData,
        request.metadata,
        request.ttlHours || 24,
        request.maxDownloads // Pass undefined if not specified, let entity handle it
      );

      // 3. Store encrypted file (server never sees keys or plaintext)
      await this.fileRepository.store(sharedFile);      // 4. Generate share URL base (without encryption key)
      // Client will add the encryption key to create the full share URL
      const shareBaseUrl = `${this.baseUrl}/s/${sharedFile.id}`;      // 5. Return privacy-safe response
      return {
        fileId: sharedFile.id,
        shareUrl: shareBaseUrl, // Base URL without key - client will add the key
        expiresAt: sharedFile.expiresAt,
        maxDownloads: request.maxDownloads !== undefined ? sharedFile.maxDownloads : null, // null = unlimited
        size: sharedFile.size,
        isPasswordProtected: !!request.isPasswordProtected,
      };

    } catch (error) {
      // Log error without sensitive data
      console.error('Anonymous upload failed:', {
        fileSize: request.encryptedData.byteLength,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error('Upload failed. Please try again.');
    }
  }

  /**
   * Validate upload request for encrypted data
   */
  private validateRequest(request: UploadAnonymousRequest): void {
    // Validate encrypted data
    if (!request.encryptedData) {
      throw new Error('Encrypted data is required');
    }

    if (request.encryptedData.byteLength === 0) {
      throw new Error('Encrypted data cannot be empty');
    }

    if (request.encryptedData.byteLength > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('File size exceeds maximum limit of 100MB');
    }

    // Validate metadata
    if (!request.metadata) {
      throw new Error('Metadata is required');
    }

    if (request.metadata.size !== request.encryptedData.byteLength) {
      throw new Error('Metadata size does not match encrypted data size');
    }

    // Validate TTL
    if (request.ttlHours !== undefined) {
      if (!Number.isInteger(request.ttlHours) || request.ttlHours <= 0) {
        throw new Error('TTL must be a positive integer');
      }

      if (request.ttlHours > 168) { // 7 days maximum
        throw new Error('TTL cannot exceed 168 hours (7 days)');
      }
    }

    // Validate download limits
    if (request.maxDownloads !== undefined) {
      if (!Number.isInteger(request.maxDownloads) || request.maxDownloads <= 0) {
        throw new Error('Max downloads must be a positive integer');
      }

      if (request.maxDownloads > 1000) {
        throw new Error('Max downloads cannot exceed 1000');
      }
    }
  }
}
