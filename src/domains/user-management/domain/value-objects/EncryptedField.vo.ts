/**
 * 🔐 EncryptedField Value Object - Client-Side Encrypted Data Storage
 * 
 * Represents an encrypted piece of personal data (email, name, etc.).
 * Zero-knowledge: Server stores encrypted data but cannot decrypt it.
 * 
 * @domain user-management
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - server cannot decrypt, only client has keys
 */

import crypto from 'crypto';
import { ValueObject } from '../../../../shared/domain/types';

export interface EncryptedFieldData {
  readonly content: string;        // AES-256-GCM encrypted data (base64)
  readonly iv: string;             // Initialization vector (base64) - 12 bytes for GCM
  readonly tag: string;            // Authentication tag (base64) - from GCM
  readonly algorithm: 'aes-256-gcm';
}

/**
 * EncryptedField value object for storing encrypted personal data
 */
export class EncryptedField extends ValueObject implements EncryptedFieldData {
  public readonly algorithm = 'aes-256-gcm' as const;

  private constructor(
    public readonly content: string,
    public readonly iv: string,
    public readonly tag: string
  ) {
    super();
    this.validateEncryptedField();
  }  /**
   * Encrypt plaintext data using AES-256-GCM
   */
  static async encrypt(
    plaintext: string,
    encryptionKey?: string
  ): Promise<EncryptedField> {
    // Generate or use provided encryption key (must be 32 bytes for AES-256)
    const key = encryptionKey
      ? Buffer.from(encryptionKey, 'hex')
      : crypto.randomBytes(32); // AES-256 key

    // Ensure key is exactly 32 bytes
    if (key.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes for AES-256');
    }

    // Generate random IV (12 bytes for GCM mode)
    const iv = crypto.randomBytes(12);

    // Create cipher using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag from GCM
    const tag = cipher.getAuthTag().toString('base64');

    return new EncryptedField(
      encrypted,
      iv.toString('base64'),
      tag
    );
  }

  /**
   * Create EncryptedField from stored data
   */
  static fromData(data: EncryptedFieldData): EncryptedField {
    return new EncryptedField(data.content, data.iv, data.tag);
  }  /**
   * Decrypt the encrypted field using AES-256-GCM (requires original encryption key)
   */
  async decrypt(encryptionKey: string): Promise<string> {
    try {
      const key = Buffer.from(encryptionKey, 'hex');
      const iv = Buffer.from(this.iv, 'base64');
      const tag = Buffer.from(this.tag, 'base64');

      // Ensure key is exactly 32 bytes
      if (key.length !== 32) {
        throw new Error('Encryption key must be exactly 32 bytes for AES-256');
      }

      // Create decipher using AES-256-GCM
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

      // Set the authentication tag for GCM verification
      decipher.setAuthTag(tag);

      // Decrypt data
      let decrypted = decipher.update(this.content, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt field: invalid key or corrupted data');
    }
  }

  /**
   * Check if the field can be decrypted with given key
   */
  async canDecryptWith(encryptionKey: string): Promise<boolean> {
    try {
      await this.decrypt(encryptionKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get size of encrypted data in bytes
   */
  getEncryptedSize(): number {
    return Buffer.from(this.content, 'base64').length;
  }

  /**
   * Validate encrypted field structure
   */
  private validateEncryptedField(): void {
    if (!this.content || typeof this.content !== 'string') {
      throw new Error('EncryptedField content must be a non-empty string');
    }

    if (!this.iv || typeof this.iv !== 'string') {
      throw new Error('EncryptedField IV must be a non-empty string');
    }

    if (!this.tag || typeof this.tag !== 'string') {
      throw new Error('EncryptedField tag must be a non-empty string');
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(this.content)) {
      throw new Error('EncryptedField content must be valid base64');
    }

    if (!base64Regex.test(this.iv)) {
      throw new Error('EncryptedField IV must be valid base64');
    }

    if (!base64Regex.test(this.tag)) {
      throw new Error('EncryptedField tag must be valid base64');
    }
  }

  /**
   * Convert to storage format
   */
  toData(): EncryptedFieldData {
    return {
      content: this.content,
      iv: this.iv,
      tag: this.tag,
      algorithm: this.algorithm
    };
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof EncryptedField &&
      obj.content === this.content &&
      obj.iv === this.iv &&
      obj.tag === this.tag;
  }

  /**
   * String representation (safe - no sensitive data)
   */
  toString(): string {
    return `EncryptedField[algorithm=${this.algorithm}, size=${this.getEncryptedSize()}]`;
  }
}
