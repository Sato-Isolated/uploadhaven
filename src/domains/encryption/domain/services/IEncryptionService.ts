import { EncryptionKey } from '../value-objects/EncryptionKey';
import { InitializationVector } from '../value-objects/InitializationVector';

/**
 * Encryption service interface for zero-knowledge file encryption
 * 
 * CRITICAL PRIVACY GUARANTEE:
 * - All encryption operations MUST be performed client-side only
 * - Server implementations of this interface MUST throw privacy violation errors
 * - Keys are never exposed to server-side code
 */
export interface IEncryptionService {
  /**
   * Generate a new encryption key
   * CLIENT-SIDE ONLY
   */
  generateKey(): EncryptionKey;

  /**
   * Derive encryption key from password
   * CLIENT-SIDE ONLY
   */
  deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{
    key: EncryptionKey;
    salt: Uint8Array;
  }>;

  /**
   * Encrypt file data with metadata
   * CLIENT-SIDE ONLY
   */
  encryptFile(file: File, key: EncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
    originalMetadata: {
      filename: string;
      mimeType: string;
      size: number;
    };
  }>;

  /**
   * Decrypt file data
   * CLIENT-SIDE ONLY
   */
  decryptFile(
    encryptedData: Uint8Array,
    key: EncryptionKey,
    iv: InitializationVector
  ): Promise<{
    fileData: Uint8Array;
    metadata: {
      filename: string;
      mimeType: string;
      size: number;
    };
  }>;

  /**
   * Encrypt arbitrary data (for metadata)
   * CLIENT-SIDE ONLY
   */
  encryptData(data: Uint8Array, key: EncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
  }>;

  /**
   * Decrypt arbitrary data
   * CLIENT-SIDE ONLY
   */
  decryptData(
    encryptedData: Uint8Array,
    key: EncryptionKey,
    iv: InitializationVector
  ): Promise<Uint8Array>;

  /**
   * Validate browser support for required crypto features
   */
  checkBrowserSupport(): {
    supported: boolean;
    missingFeatures: string[];
  };

  /**
   * Generate salt for password-based key derivation
   */
  generateSalt(): Uint8Array;
}

/**
 * Encryption configuration
 */
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 32, // 256 bits
  ivLength: 12, // 96 bits for GCM
  saltLength: 32, // 256 bits
  tagLength: 16, // 128 bits
  iterations: 100000, // PBKDF2 iterations
} as const;

/**
 * Encryption result for file operations
 */
export interface EncryptionResult {
  encryptedData: Uint8Array;
  iv: InitializationVector;
  key: EncryptionKey;
  metadata: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    iterations?: number; // Present for password-derived keys
  };
}

/**
 * Decryption result for file operations
 */
export interface DecryptionResult {
  fileData: Uint8Array;
  originalMetadata: {
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt?: Date;
  };
}
