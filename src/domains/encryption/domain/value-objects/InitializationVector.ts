import { ValueObject } from '../../../../shared/domain/types';

/**
 * InitializationVector value object for AES-GCM encryption
 * 
 * Represents a cryptographically secure initialization vector (IV) used in AES-GCM.
 * IVs are public and can be stored with encrypted data without compromising security.
 */
export class InitializationVector extends ValueObject {
  private static readonly IV_LENGTH = 12; // 96 bits for AES-GCM (recommended)

  private constructor(private readonly _value: Uint8Array) {
    super();
    if (_value.length !== InitializationVector.IV_LENGTH) {
      throw new Error(`IV must be exactly ${InitializationVector.IV_LENGTH} bytes`);
    }
  }
  /**
   * Generate a cryptographically secure random IV
   * Can be called client-side or server-side (IV is public)
   */  static generate(): InitializationVector {
    const ivBytes = typeof window !== 'undefined'
      ? crypto.getRandomValues(new Uint8Array(InitializationVector.IV_LENGTH))
      : (() => {
          // Server-side: use Node.js crypto module
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const crypto = require('crypto');
          return new Uint8Array(crypto.randomBytes(InitializationVector.IV_LENGTH));
        })();

    return new InitializationVector(ivBytes);
  }

  /**
   * Create IV from base64 string
   */
  static fromBase64(base64: string): InitializationVector {
    try {
      const ivBytes = typeof window !== 'undefined'
        ? Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        : new Uint8Array(Buffer.from(base64, 'base64'));

      return new InitializationVector(ivBytes);    } catch {
      throw new Error('Invalid IV format');
    }
  }
  /**
   * Create IV from hex string
   */
  static fromHex(hex: string): InitializationVector {
    if (hex.length !== InitializationVector.IV_LENGTH * 2) {
      throw new Error('Invalid hex IV length');
    }

    const ivBytes = new Uint8Array(InitializationVector.IV_LENGTH);
    for (let i = 0; i < InitializationVector.IV_LENGTH; i++) {
      ivBytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    return new InitializationVector(ivBytes);
  }

  /**
   * Create IV from existing bytes
   */
  static fromBytes(bytes: Uint8Array): InitializationVector {
    return new InitializationVector(bytes);
  }

  /**
   * Export IV as base64 string for storage/transmission
   */
  toBase64(): string {
    if (typeof window !== 'undefined') {
      return btoa(String.fromCharCode(...this._value));
    } else {
      return Buffer.from(this._value).toString('base64');
    }
  }

  /**
   * Export IV as hex string
   */
  toHex(): string {
    return Array.from(this._value)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get raw IV bytes for crypto operations
   */
  getBytes(): Uint8Array {
    return this._value.slice(); // Return copy to prevent mutation
  }

  equals(obj: ValueObject): boolean {
    if (!(obj instanceof InitializationVector)) return false;

    if (this._value.length !== obj._value.length) return false;

    for (let i = 0; i < this._value.length; i++) {
      if (this._value[i] !== obj._value[i]) return false;
    }

    return true;
  }
}
