/**
 * 🔐 Encrypted File Entity (Privacy-First)
 * 
 * Represents a file that has been encrypted client-side.
 * Server only stores encrypted blob - cannot decrypt.
 */

import { EncryptionKey } from '../value-objects/EncryptionKey';
import { FileId } from '../../../file-sharing/domain/value-objects/file-id.vo';

export interface EncryptedFileMetadata {
  readonly originalSize: number;
  readonly encryptedSize: number;
  readonly algorithm: 'AES-256-GCM';
  readonly mimeType?: string; // Optional, not required for privacy
  readonly filename?: string; // Optional, not stored on server
  readonly timestamp: Date;
}

export class EncryptedFile {
  private constructor(
    private readonly _id: string,
    private readonly _encryptedBlob: Uint8Array,
    private readonly _iv: Uint8Array,
    private readonly _metadata: EncryptedFileMetadata
  ) { }
  /**
   * ✅ SAFE: Create encrypted file from client-side encryption
   */
  static create(
    id: string,
    encryptedBlob: Uint8Array,
    iv: Uint8Array,
    metadata: EncryptedFileMetadata
  ): EncryptedFile {
    // Validate IV length for AES-GCM
    if (iv.length !== 12) {
      throw new Error('IV must be exactly 12 bytes for AES-GCM');
    }

    return new EncryptedFile(id, encryptedBlob, iv, metadata);
  }

  /**
   * ✅ SAFE: Factory method for client-side encryption
   */
  static async createFromFile(
    file: File,
    encryptionKey: EncryptionKey
  ): Promise<EncryptedFile> {
    // Validate file size
    if (file.size === 0) {
      throw new Error('Cannot encrypt empty file');
    }

    // Validate file size limit (100MB)
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxFileSize) {
      throw new Error('File too large');
    }

    // Generate unique file ID (compatible with FileId format)
    const id = FileId.generate().value;

    // Generate random IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    // Read file content
    const fileBuffer = await file.arrayBuffer();

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encryptionKey.toBytes(),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt file content
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      fileBuffer
    );

    const metadata: EncryptedFileMetadata = {
      originalSize: file.size,
      encryptedSize: encryptedBuffer.byteLength,
      algorithm: 'AES-256-GCM',
      mimeType: file.type || undefined,
      filename: file.name || undefined,
      timestamp: new Date()
    };

    return new EncryptedFile(
      id,
      new Uint8Array(encryptedBuffer),
      iv,
      metadata
    );
  }
  /**
   * ✅ SAFE: Reconstitute encrypted file from stored data
   * Used by repository when loading from database
   */
  static fromStoredData(
    id: string,
    encryptedBlob: Uint8Array,
    iv: string,
    encryptedSize: number
  ): EncryptedFile {
    // Convert base64 IV back to Uint8Array
    const ivBytes = new Uint8Array(Buffer.from(iv, 'base64'));

    // Create minimal metadata for stored files
    const metadata: EncryptedFileMetadata = {
      originalSize: encryptedSize, // We don't know original size from storage
      encryptedSize,
      algorithm: 'AES-256-GCM',
      timestamp: new Date(), // Current time since we don't store this
    };

    return new EncryptedFile(id, encryptedBlob, ivBytes, metadata);
  }

  // ✅ SAFE: Public accessors (no sensitive data)
  get id(): string { return this._id; }
  get encryptedSize(): number { return this._metadata.encryptedSize; }
  get originalSize(): number { return this._metadata.originalSize; }
  get algorithm(): string { return this._metadata.algorithm; }
  get timestamp(): Date { return this._metadata.timestamp; }

  /**
   * ✅ SAFE: IV is public (not secret)
   */
  get iv(): Uint8Array { return new Uint8Array(this._iv); }

  /**
   * ✅ SAFE: Encrypted blob for server storage
   * Server can store this but cannot decrypt without key
   */
  get encryptedBlob(): Uint8Array {
    return new Uint8Array(this._encryptedBlob);
  }

  /**
   * ✅ SAFE: Metadata for server storage (privacy-aware)
   * Only includes non-sensitive information
   */
  get serverMetadata(): {
    id: string;
    encryptedSize: number;
    algorithm: string;
    timestamp: Date;
    // NO: originalSize, mimeType, filename (privacy protection)
  } {
    return {
      id: this._id,
      encryptedSize: this._metadata.encryptedSize,
      algorithm: this._metadata.algorithm,
      timestamp: this._metadata.timestamp
    };
  }

  /**
   * ✅ SAFE: Full metadata for client-side use
   */
  get clientMetadata(): EncryptedFileMetadata {
    return { ...this._metadata };
  }
  /**
   * ✅ SAFE: Decrypt file on client-side
   */
  async decrypt(encryptionKey?: EncryptionKey): Promise<File> {
    // Validate encryption key parameter
    if (!encryptionKey) {
      throw new Error('PRIVACY VIOLATION: Encryption key is required for decryption');
    }

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encryptionKey.toBytes(),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt file content
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this._iv
      },
      cryptoKey,
      this._encryptedBlob
    );

    // Recreate File object
    const filename = this._metadata.filename || 'download';
    const mimeType = this._metadata.mimeType || 'application/octet-stream';

    return new File([decryptedBuffer], filename, { type: mimeType });
  }

  /**
   * ✅ SAFE: Secure disposal
   */
  dispose(): void {
    // Overwrite sensitive data
    crypto.getRandomValues(this._encryptedBlob);
    crypto.getRandomValues(this._iv);
  }  /**
   * ❌ FORBIDDEN: Never expose decryption methods server-side
   */
  toString(): string {
    return `[EncryptedFile ID: ${this._id}]`;
  }

  /**
   * ❌ FORBIDDEN: Direct access to plaintext without key
   */
  getPlaintext(): never {
    throw new Error('PRIVACY VIOLATION: Cannot access plaintext without encryption key');
  }
}
