/**
 * 🔐 Encryption Service Interface (Zero-Knowledge)
 * 
 * Defines contracts for client-side encryption operations.
 * All implementations must enforce zero-knowledge patterns.
 */

import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { EncryptedFile } from '../../domain/entities/encrypted-file.entity';

export interface IEncryptionService {
  /**
   * Generate random encryption key (client-side only)
   */
  generateRandomKey(): Promise<EncryptionKey>;

  /**
   * Derive encryption key from password (client-side only)
   */
  deriveKeyFromPassword(
    password: string,
    salt?: Uint8Array,
    iterations?: number
  ): Promise<EncryptionKey>;

  /**
   * Encrypt file with AES-256-GCM (client-side only)
   */
  encryptFile(
    file: File,
    encryptionKey: EncryptionKey,
    algorithm?: 'AES-256-GCM'
  ): Promise<EncryptedFile>;

  /**
   * Decrypt file with encryption key (client-side only)
   */
  decryptFile(
    encryptedFile: EncryptedFile,
    encryptionKey: EncryptionKey
  ): Promise<File>;

  /**
   * Validate encryption parameters
   */
  validateEncryptionParams(params: {
    fileSize: number;
    algorithm: string;
    keyLength: number;
  }): Promise<boolean>;

  /**
   * Generate secure random salt for key derivation
   */
  generateSalt(): Uint8Array;
}

export interface IKeyManagementService {
  /**
   * Store encryption key in browser (temporary, session-based)
   */
  storeKeyTemporarily(keyId: string, key: EncryptionKey): Promise<void>;

  /**
   * Retrieve encryption key from browser storage
   */
  retrieveKey(keyId: string): Promise<EncryptionKey | null>;

  /**
   * Clear key from browser storage
   */
  clearKey(keyId: string): Promise<void>;

  /**
   * Clear all keys from browser storage
   */
  clearAllKeys(): Promise<void>;

  /**
   * Generate share URL with key in fragment
   * Format: https://uploadhaven.dev/s/fileId#encryptionKey
   */
  generateShareUrl(fileId: string, encryptionKey: EncryptionKey, baseUrl: string): string;

  /**
   * Extract encryption key from share URL fragment
   */
  extractKeyFromShareUrl(shareUrl: string): EncryptionKey | null;
}

export interface EncryptionValidationError {
  code: 'FILE_TOO_LARGE' | 'EMPTY_FILE' | 'INVALID_ALGORITHM' | 'WEAK_PASSWORD';
  message: string;
  field?: string;
}

export interface EncryptionResult {
  encryptedFile: EncryptedFile;
  encryptionKey: EncryptionKey;
  shareUrl: string;
  metadata: {
    algorithm: string;
    originalSize: number;
    encryptedSize: number;
    timestamp: Date;
  };
}

export interface DecryptionResult {
  file: File;
  metadata: {
    originalSize: number;
    algorithm: string;
    timestamp: Date;
  };
}
