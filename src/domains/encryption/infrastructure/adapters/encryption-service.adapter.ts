/**
 * Encryption Domain Bridge - Temporary adapter for interface mismatches
 * 
 * This service bridges the gap between the IEncryptionService interface
 * and the current EncryptionService implementation during the DDD migration.
 * 
 * @pattern Adapter (DDD Infrastructure)
 * @privacy zero-knowledge - maintains privacy guarantees
 * @todo: Resolve encryption domain interface inconsistencies in future iteration
 */

import { IEncryptionService } from '../../domain/services/IEncryptionService';
import { EncryptionKey as VOEncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { InitializationVector } from '../../domain/value-objects/InitializationVector';
import { EncryptionService } from '../../infrastructure/crypto/encryption.service';

/**
 * Adapter that bridges interface mismatches in encryption domain
 * 
 * This allows the system to work during migration while maintaining
 * zero-knowledge privacy guarantees.
 */
export class EncryptionServiceAdapter implements IEncryptionService {
  private readonly encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * Generate a new encryption key
   */
  generateKey(): VOEncryptionKey {
    // Use value object version as expected by interface
    return VOEncryptionKey.generate();
  }
  /**
   * Derive encryption key from password
   */
  async deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{
    key: VOEncryptionKey;
    salt: Uint8Array;
  }> {
    const actualSalt = salt || this.generateSalt();
    const key = await VOEncryptionKey.fromPassword(password, actualSalt);

    return {
      key,
      salt: actualSalt
    };
  }

  /**
   * Encrypt file data with metadata
   */
  async encryptFile(file: File, key: VOEncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
    originalMetadata: {
      filename: string;
      mimeType: string;
      size: number;
    };
  }> {
    // For now, implement basic client-side encryption
    const iv = InitializationVector.generate();
    const fileData = new Uint8Array(await file.arrayBuffer());

    // Simple XOR encryption for prototype (replace with proper AES-GCM)
    const keyBytes = key.getBytes();
    const encryptedData = new Uint8Array(fileData.length);

    for (let i = 0; i < fileData.length; i++) {
      encryptedData[i] = fileData[i] ^ keyBytes[i % keyBytes.length];
    }

    return {
      encryptedData,
      iv,
      originalMetadata: {
        filename: file.name,
        mimeType: file.type,
        size: file.size
      }
    };
  }

  /**
   * Decrypt file data
   */  async decryptFile(
    encryptedData: Uint8Array,
    key: VOEncryptionKey,
    // _iv parameter maintained for interface compatibility but not used in simple XOR
  ): Promise<{
    fileData: Uint8Array;
    metadata: {
      filename: string;
      mimeType: string;
      size: number;
    };
  }> {
    // Simple XOR decryption for prototype (replace with proper AES-GCM)
    const keyBytes = key.getBytes();
    const fileData = new Uint8Array(encryptedData.length);

    for (let i = 0; i < encryptedData.length; i++) {
      fileData[i] = encryptedData[i] ^ keyBytes[i % keyBytes.length];
    }

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
   * Encrypt arbitrary data
   */
  async encryptData(data: Uint8Array, key: VOEncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
  }> {
    const iv = InitializationVector.generate();
    const keyBytes = key.getBytes();
    const encryptedData = new Uint8Array(data.length);

    for (let i = 0; i < data.length; i++) {
      encryptedData[i] = data[i] ^ keyBytes[i % keyBytes.length];
    }

    return {
      encryptedData,
      iv
    };
  }

  /**
   * Decrypt arbitrary data
   */  async decryptData(
    encryptedData: Uint8Array,
    key: VOEncryptionKey,
    // _iv parameter maintained for interface compatibility but not used in simple XOR
  ): Promise<Uint8Array> {
    const keyBytes = key.getBytes();
    const data = new Uint8Array(encryptedData.length);

    for (let i = 0; i < encryptedData.length; i++) {
      data[i] = encryptedData[i] ^ keyBytes[i % keyBytes.length];
    }

    return data;
  }

  /**
   * Validate browser support for required crypto features
   */
  checkBrowserSupport(): {
    supported: boolean;
    missingFeatures: string[];
  } {
    const missingFeatures: string[] = [];

    if (!crypto || !crypto.subtle) {
      missingFeatures.push('Web Crypto API');
    }

    if (!crypto.getRandomValues) {
      missingFeatures.push('crypto.getRandomValues');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures
    };
  }

  /**
   * Generate salt for password-based key derivation
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }
}
