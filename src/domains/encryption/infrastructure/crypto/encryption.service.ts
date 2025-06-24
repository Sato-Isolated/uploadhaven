/**
 * 🔐 Encryption Service Implementation (Zero-Knowledge)
 * 
 * Client-side encryption service using Web Crypto API.
 * Implements zero-knowledge patterns for UploadHaven.
 */

import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { EncryptedFile } from '../../domain/entities/encrypted-file.entity';
import { InitializationVector } from '../../domain/value-objects/InitializationVector';
import { IEncryptionService } from '../../domain/services/IEncryptionService';

export class EncryptionService implements IEncryptionService {
  /**
   * Generate random encryption key (client-side only)
   */
  generateKey(): EncryptionKey {
    return EncryptionKey.generate();
  }  /**
   * Derive encryption key from password (client-side only)
   * Domain interface implementation
   */
  async deriveKeyFromPassword(
    password: string,
    salt?: Uint8Array
  ): Promise<{ key: EncryptionKey; salt: Uint8Array }> {
    const actualSalt = salt || this.generateSalt();
    const key = await EncryptionKey.fromPassword(password, actualSalt);
    return { key, salt: actualSalt };
  }  /**
   * Encrypt file with metadata (client-side only)
   * Domain interface implementation
   */
  async encryptFile(file: File, key: EncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
    originalMetadata: {
      filename: string;
      mimeType: string;
      size: number;
    };
  }> {
    // Validate inputs
    this.validateEncryptionInputs(file, key, 'AES-256-GCM');

    // Create file metadata
    const metadata = {
      filename: file.name,
      mimeType: file.type,
      size: file.size
    };

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(fileBuffer);

    // Encrypt file data (this generates and uses the correct IV)
    const encryptionResult = await this.encryptData(fileData, key);

    return {
      encryptedData: encryptionResult.encryptedData,
      iv: encryptionResult.iv, // Use the IV that was actually used for encryption
      originalMetadata: metadata
    };
  }

  /**
   * Decrypt file data (client-side only)
   * Domain interface implementation
   */
  async decryptFile(
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
  }> {
    // Decrypt the data
    const fileData = await this.decryptData(encryptedData, key, iv);

    // For now, return basic metadata - in real implementation this would be
    // extracted from the decrypted data structure
    return {
      fileData,
      metadata: {
        filename: 'decrypted-file',
        mimeType: 'application/octet-stream',
        size: fileData.length
      }
    };
  }

  /**
   * Helper method for working with EncryptedFile entities
   */
  async encryptFileEntity(
    file: File,
    encryptionKey: EncryptionKey,
    algorithm: 'AES-256-GCM' = 'AES-256-GCM'
  ): Promise<EncryptedFile> {
    // Validate inputs
    this.validateEncryptionInputs(file, encryptionKey, algorithm);

    // Use EncryptedFile's factory method
    return EncryptedFile.createFromFile(file, encryptionKey);
  }

  /**
   * Helper method for working with EncryptedFile entities
   */
  async decryptFileEntity(
    encryptedFile: EncryptedFile,
    encryptionKey: EncryptionKey
  ): Promise<File> {
    // Validate inputs
    this.validateDecryptionInputs(encryptedFile, encryptionKey);

    // Use EncryptedFile's decryption method
    return encryptedFile.decrypt(encryptionKey);
  }

  /**
   * Encrypt arbitrary data (for metadata)
   * CLIENT-SIDE ONLY
   */
  async encryptData(data: Uint8Array, key: EncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
  }> {
    const iv = InitializationVector.generate();

    // Get the raw key bytes
    const keyBytes = key.toBytes();

    // Import key for Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv.getBytes()
      },
      cryptoKey,
      data
    );

    return {
      encryptedData: new Uint8Array(encryptedBuffer),
      iv
    };
  }
  /**
   * Decrypt arbitrary data
   * CLIENT-SIDE ONLY
   */  async decryptData(
    encryptedData: Uint8Array,
    key: EncryptionKey,
    iv: InitializationVector
  ): Promise<Uint8Array> {
    try {
      // Get the raw key bytes
      const keyBytes = key.toBytes();

      // Import key for Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Get IV bytes
      const ivBytes = iv.getBytes();

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes
        },
        cryptoKey,
        encryptedData
      );

      return new Uint8Array(decryptedBuffer);

    } catch (error) {
      // Re-throw with context for debugging
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate encryption parameters
   */
  async validateEncryptionParams(params: {
    fileSize: number;
    algorithm: string;
    keyLength: number;
  }): Promise<boolean> {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const SUPPORTED_ALGORITHMS = ['AES-256-GCM'];
    const REQUIRED_KEY_LENGTH = 32; // 256 bits

    if (params.fileSize <= 0 || params.fileSize > MAX_FILE_SIZE) {
      return false;
    }

    if (!SUPPORTED_ALGORITHMS.includes(params.algorithm)) {
      return false;
    }

    if (params.keyLength !== REQUIRED_KEY_LENGTH) {
      return false;
    }

    return true;
  }

  /**
   * Generate secure random salt for key derivation
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
  }

  /**
   * Validate browser support for required crypto features
   */
  checkBrowserSupport(): {
    supported: boolean;
    missingFeatures: string[];
  } {
    const missingFeatures: string[] = [];

    // Check for Web Crypto API
    if (!window.crypto || !window.crypto.subtle) {
      missingFeatures.push('Web Crypto API');
    }

    // Check for required crypto operations
    try {
      if (!window.crypto.getRandomValues) {
        missingFeatures.push('crypto.getRandomValues');
      }    } catch {
      missingFeatures.push('crypto.getRandomValues');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures
    };
  }

  /**
   * Generate random key (alias for generateKey to match interface)
   */
  generateRandomKey(): Promise<EncryptionKey> {
    return Promise.resolve(this.generateKey());
  }

  private validateEncryptionInputs(
    file: File,
    encryptionKey: EncryptionKey,
    algorithm: string
  ): void {
    if (!file) {
      throw new Error('File is required for encryption');
    }

    if (file.size === 0) {
      throw new Error('Cannot encrypt empty file');
    }

    if (!encryptionKey) {
      throw new Error('Encryption key is required');
    }

    if (algorithm !== 'AES-256-GCM') {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }
  }

  private validateDecryptionInputs(
    encryptedFile: EncryptedFile,
    encryptionKey: EncryptionKey
  ): void {
    if (!encryptedFile) {
      throw new Error('Encrypted file is required for decryption');
    }

    if (!encryptionKey) {
      throw new Error('Encryption key is required for decryption');
    }

    if (encryptedFile.encryptedSize === 0) {
      throw new Error('Cannot decrypt empty file');
    }
  }
}

/**
 * Key Management Service for browser storage
 */
export class KeyManagementService /* implements IKeyManagementService */ {
  private readonly STORAGE_PREFIX = 'uploadhaven_key_';

  /**
   * Store encryption key in browser (temporary, session-based)
   */
  async storeKeyTemporarily(keyId: string, key: EncryptionKey): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Key storage only available in browser environment');
    }

    const storageKey = this.STORAGE_PREFIX + keyId;
    const keyBase64 = key.toBase64();

    // Use sessionStorage for temporary storage (cleared when tab closes)
    sessionStorage.setItem(storageKey, keyBase64);
  }

  /**
   * Retrieve encryption key from browser storage
   */
  async retrieveKey(keyId: string): Promise<EncryptionKey | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const storageKey = this.STORAGE_PREFIX + keyId;
    const keyBase64 = sessionStorage.getItem(storageKey);

    if (!keyBase64) {
      return null;
    }

    try {
      return EncryptionKey.fromBase64(keyBase64);
    } catch (error) {
      console.warn('Failed to retrieve encryption key:', error);
      // Remove corrupted key
      sessionStorage.removeItem(storageKey);
      return null;
    }
  }

  /**
   * Clear key from browser storage
   */
  async clearKey(keyId: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKey = this.STORAGE_PREFIX + keyId;
    sessionStorage.removeItem(storageKey);
  }

  /**
   * Clear all keys from browser storage
   */
  async clearAllKeys(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Generate share URL with key in fragment
   * Format: https://uploadhaven.dev/s/fileId#encryptionKey
   */
  generateShareUrl(fileId: string, encryptionKey: EncryptionKey, baseUrl: string): string {
    const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${cleanBaseUrl}/s/${fileId}#${encryptionKey.toBase64()}`;
  }

  /**
   * Extract encryption key from share URL fragment
   */
  extractKeyFromShareUrl(shareUrl: string): EncryptionKey | null {
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
}
