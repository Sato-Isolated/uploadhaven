import { Entity, Id, Timestamp } from '../../../../shared/domain/types';
import { EncryptionKey } from '../value-objects/EncryptionKey';
import { InitializationVector } from '../value-objects/InitializationVector';

/**
 * EncryptedFile entity - represents a file that has been encrypted using zero-knowledge principles
 * 
 * PRIVACY GUARANTEES:
 * - Server can only store encrypted blob and public metadata
 * - Original filename, content, and encryption keys are never stored server-side
 * - Entity enforces zero-knowledge patterns at the domain level
 */
export class EncryptedFile extends Entity<Id> {
  private constructor(
    id: Id,
    private readonly _encryptedBlob: Uint8Array,
    private readonly _iv: InitializationVector,
    private readonly _encryptedSize: number,
    private readonly _uploadedAt: Timestamp,
    private readonly _expiresAt: Timestamp,
    private readonly _maxDownloads: number,
    private readonly _currentDownloads: number = 0
  ) {
    super(id);

    if (_encryptedSize <= 0) {
      throw new Error('Encrypted file size must be positive');
    }

    if (_maxDownloads <= 0) {
      throw new Error('Max downloads must be positive');
    }

    if (_currentDownloads < 0) {
      throw new Error('Current downloads cannot be negative');
    }

    if (_expiresAt.value <= _uploadedAt.value) {
      throw new Error('Expiration date must be after upload date');
    }
  }

  /**
   * Create a new encrypted file entity (factory method)
   * This should only be called after client-side encryption
   */
  static create(
    encryptedBlob: Uint8Array,
    iv: InitializationVector,
    expiresAt: Date,
    maxDownloads: number
  ): EncryptedFile {
    const id = Id.generate();
    const uploadedAt = Timestamp.now();
    const expirationTimestamp = new Timestamp(expiresAt);

    return new EncryptedFile(
      id,
      encryptedBlob,
      iv,
      encryptedBlob.length,
      uploadedAt,
      expirationTimestamp,
      maxDownloads
    );
  }

  /**
   * Reconstitute from persistence (repository)
   */
  static fromPersistence(
    id: string,
    encryptedBlob: Uint8Array,
    iv: InitializationVector,
    uploadedAt: Date,
    expiresAt: Date,
    maxDownloads: number,
    currentDownloads: number
  ): EncryptedFile {
    return new EncryptedFile(
      new Id(id),
      encryptedBlob,
      iv,
      encryptedBlob.length,
      new Timestamp(uploadedAt),
      new Timestamp(expiresAt),
      maxDownloads,
      currentDownloads
    );
  }

  // Public accessors (safe for server-side access)
  get encryptedBlob(): Uint8Array {
    return this._encryptedBlob.slice(); // Return copy
  }

  get iv(): InitializationVector {
    return this._iv;
  }

  get encryptedSize(): number {
    return this._encryptedSize;
  }

  get uploadedAt(): Date {
    return this._uploadedAt.value;
  }

  get expiresAt(): Date {
    return this._expiresAt.value;
  }

  get maxDownloads(): number {
    return this._maxDownloads;
  }

  get currentDownloads(): number {
    return this._currentDownloads;
  }

  // Business logic methods

  /**
   * Check if file has expired
   */
  isExpired(): boolean {
    return new Date() > this._expiresAt.value;
  }

  /**
   * Check if file has reached download limit
   */
  hasReachedDownloadLimit(): boolean {
    return this._currentDownloads >= this._maxDownloads;
  }

  /**
   * Check if file is available for download
   */
  isAvailableForDownload(): boolean {
    return !this.isExpired() && !this.hasReachedDownloadLimit();
  }

  /**
   * Record a download attempt
   * Returns new entity with incremented download count
   */
  recordDownload(): EncryptedFile {
    if (!this.isAvailableForDownload()) {
      throw new Error('File is not available for download');
    }

    return new EncryptedFile(
      this._id,
      this._encryptedBlob,
      this._iv,
      this._encryptedSize,
      this._uploadedAt,
      this._expiresAt,
      this._maxDownloads,
      this._currentDownloads + 1
    );
  }

  /**
   * Get remaining download count
   */
  getRemainingDownloads(): number {
    return Math.max(0, this._maxDownloads - this._currentDownloads);
  }

  /**
   * Get time until expiration in milliseconds
   */
  getTimeUntilExpiration(): number {
    return Math.max(0, this._expiresAt.value.getTime() - Date.now());
  }

  /**
   * Generate share URL with encryption key in fragment
   * CRITICAL: Key must be passed separately and added to URL fragment client-side only
   */
  generateShareUrl(baseUrl: string): string {
    // Note: This returns URL WITHOUT key - key must be added client-side
    return `${baseUrl}/s/${this.id.value}`;
  }

  /**
   * Generate complete share URL with key in fragment (client-side only)
   */
  generateSecureShareUrl(baseUrl: string, encryptionKey: EncryptionKey): string {
    if (typeof window === 'undefined') {
      throw new Error('PRIVACY VIOLATION: Secure share URLs can only be generated client-side');
    }

    const baseShareUrl = this.generateShareUrl(baseUrl);
    const keyFragment = encryptionKey.toBase64();

    return `${baseShareUrl}#${keyFragment}`;
  }
}
