/**
 * SharedFile Entity - Domain Model for Anonymous File Sharing
 * 
 * Represents a file shared anonymously through UploadHaven.
 * Enforces zero-knowledge principles - server never stores sensitive metadata.
 * 
 * @domain file-sharing
 * @pattern Entity (DDD)
 * @privacy zero-knowledge - no sensitive data stored server-side
 */

import { EncryptedFile } from '../../../encryption/domain/entities/encrypted-file.entity';
import { FileId } from '../value-objects/file-id.vo';
import { FileMetadata } from '../value-objects/file-metadata.vo';
import { TTL } from '../value-objects/ttl.vo';
import { DownloadLimits } from '../value-objects/download-limits.vo';

/**
 * SharedFile entity representing an anonymously shared file
 * 
 * Key principles:
 * - Zero-knowledge: No sensitive metadata stored
 * - Anonymous: No user association
 * - Ephemeral: TTL-based auto-deletion
 * - Limited: Download count restrictions
 */
export class SharedFile {
  private constructor(
    private readonly _id: FileId,
    private readonly _encryptedFile: EncryptedFile,
    private readonly _metadata: FileMetadata,
    private readonly _ttl: TTL,
    private readonly _downloadLimits: DownloadLimits,
    private _downloadCount: number = 0,
    private _isDeleted: boolean = false
  ) { }

  /**
   * Create a new shared file for anonymous sharing
   * 
   * @param encryptedFile - The encrypted file entity
   * @param ttlHours - Time-to-live in hours (default: 24h)
   * @param maxDownloads - Maximum download count (default: 10)
   * @returns Promise<SharedFile>
   */  static async createAnonymous(
    encryptedFile: EncryptedFile,
    ttlHours: number = 24,
    maxDownloads: number = 10
  ): Promise<SharedFile> {
    // Use the file ID from the encrypted file (already generated)
    const fileId = FileId.fromString(encryptedFile.id);
    const metadata = FileMetadata.createMinimal(encryptedFile.serverMetadata.encryptedSize);
    const ttl = TTL.createFromHours(ttlHours);
    const downloadLimits = DownloadLimits.create(maxDownloads);

    return new SharedFile(
      fileId,
      encryptedFile,
      metadata,
      ttl,
      downloadLimits
    );
  }

  /**
   * Reconstitute from stored data (for repository)
   */
  static fromStoredData(
    id: string,
    encryptedFile: EncryptedFile,
    size: number,
    createdAt: Date,
    expiresAt: Date,
    maxDownloads: number,
    downloadCount: number,
    isDeleted: boolean = false
  ): SharedFile {
    const fileId = FileId.fromString(id);
    const metadata = FileMetadata.createFromStored(size, createdAt);
    const ttl = TTL.fromExpirationDate(expiresAt);
    const downloadLimits = DownloadLimits.create(maxDownloads);

    return new SharedFile(
      fileId,
      encryptedFile,
      metadata,
      ttl,
      downloadLimits,
      downloadCount,
      isDeleted
    );
  }
  /**
   * Create a shared file from already-encrypted data (server-side usage)
   * 
   * @param encryptedData - Already encrypted ArrayBuffer from client
   * @param metadata - Encryption metadata from client
   * @param ttlHours - Time-to-live in hours (default: 24h)
   * @param maxDownloads - Maximum download count (undefined = unlimited, otherwise specific limit)
   * @returns Promise<SharedFile>
   */
  static async createFromEncryptedData(
    encryptedData: ArrayBuffer,
    metadata: {
      size: number;
      algorithm: string;
      iv: string;
      salt: string;
      iterations: number;
    },
    ttlHours: number = 24,
    maxDownloads?: number // Optional - undefined means unlimited
  ): Promise<SharedFile> {
    // Create a new file ID
    const fileId = FileId.generate();
      // Create minimal encrypted file entity with the provided data
    const encryptedFile = EncryptedFile.fromStoredData(
      fileId.value,
      new Uint8Array(encryptedData),
      metadata.iv,
      metadata.size
    );    const fileMetadata = FileMetadata.createMinimal(metadata.size);
    const ttl = TTL.createFromHours(ttlHours);
    const downloadLimits = maxDownloads !== undefined 
      ? DownloadLimits.create(maxDownloads)
      : DownloadLimits.createUnlimited();

    return new SharedFile(
      fileId,
      encryptedFile,
      fileMetadata,
      ttl,
      downloadLimits
    );
  }

  // =============================================================================
  // Public Accessors (Privacy-Safe)
  // =============================================================================

  get id(): string {
    return this._id.value;
  }

  get size(): number {
    return this._metadata.size;
  }

  get createdAt(): Date {
    return this._metadata.createdAt;
  }

  get expiresAt(): Date {
    return this._ttl.expiresAt;
  }

  get maxDownloads(): number {
    return this._downloadLimits.maxDownloads;
  }

  get downloadCount(): number {
    return this._downloadCount;
  }

  get remainingDownloads(): number {
    return Math.max(0, this.maxDownloads - this.downloadCount);
  }

  get isExpired(): boolean {
    return this._ttl.isExpired();
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get isAvailable(): boolean {
    return !this.isExpired && !this.isDeleted && this.remainingDownloads > 0;
  }

  get encryptedBlob(): Uint8Array {
    return this._encryptedFile.encryptedBlob;
  }  get iv(): string {
    // Convert Uint8Array IV to base64 string for storage/transmission (browser-compatible)
    const ivBytes = this._encryptedFile.iv;
    return btoa(String.fromCharCode(...ivBytes));
  }

  // =============================================================================
  // Business Operations
  // =============================================================================
  /**
   * Record a download attempt
   * @throws Error if file is not available for download
   */
  recordDownload(): void {
    if (this.isExpired) {
      throw new Error('File has expired');
    }

    if (this.isDeleted) {
      throw new Error('File has been deleted');
    }

    if (this.remainingDownloads <= 0) {
      throw new Error('Download limit exceeded');
    }

    this._downloadCount++;
  }

  /**
   * Mark file as soft-deleted (GDPR compliance)
   */
  markAsDeleted(): void {
    this._isDeleted = true;
  }

  /**
   * Check if file should be automatically deleted
   */
  shouldAutoDelete(): boolean {
    return this.isExpired || this.remainingDownloads <= 0;
  }

  /**
   * Extend TTL (if allowed by business rules)
   */
  extendTTL(additionalHours: number): void {
    if (this.isDeleted) {
      throw new Error('Cannot extend TTL of deleted file');
    }

    this._ttl.extend(additionalHours);
  }

  // =============================================================================
  // Privacy Enforcement
  // =============================================================================

  /**
   * Get storage-safe representation (no sensitive data)
   */
  toStorageData(): {
    id: string;
    encryptedBlob: Uint8Array;
    iv: string;
    size: number;
    createdAt: Date;
    expiresAt: Date;
    maxDownloads: number;
    downloadCount: number;
    isDeleted: boolean;
    // ❌ NO: originalFilename, mimeType, userAgent, ipAddress
  } {
    return {
      id: this.id,
      encryptedBlob: this.encryptedBlob,
      iv: this.iv,
      size: this.size,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      maxDownloads: this.maxDownloads,
      downloadCount: this.downloadCount,
      isDeleted: this.isDeleted,
    };
  }

  /**
   * Get public metadata (for API responses)
   */
  toPublicMetadata(): {
    id: string;
    size: number;
    expiresAt: Date;
    remainingDownloads: number;
    isAvailable: boolean;
    // ❌ NO: encryptedBlob, iv, sensitive data
  } {
    return {
      id: this.id,
      size: this.size,
      expiresAt: this.expiresAt,
      remainingDownloads: this.remainingDownloads,
      isAvailable: this.isAvailable,
    };
  }

  /**
   * String representation for debugging (no sensitive data)
   */
  toString(): string {
    return `SharedFile{ id: '${this.id}', size: ${this.size}, expires: ${this.expiresAt.toISOString()}, downloads: ${this.downloadCount}/${this.maxDownloads} }`;
  }

  // =============================================================================
  // Domain Events (for future implementation)
  // =============================================================================

  /**
   * Get domain events triggered by this entity
   */
  getDomainEvents(): Array<{
    type: string;
    payload: any;
    timestamp: Date;
  }> {
    // Future: Implement domain events for audit, notifications, etc.
    return [];
  }
}
