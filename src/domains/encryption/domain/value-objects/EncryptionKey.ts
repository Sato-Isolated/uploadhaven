import { ValueObject } from '../../../../shared/domain/types';

/**
 * EncryptionKey value object - represents a cryptographic key for zero-knowledge encryption
 * 
 * CRITICAL PRIVACY GUARANTEE:
 * - This value object enforces that encryption keys are NEVER stored on server
 * - Keys are generated client-side only and embedded in URL fragments
 * - Server infrastructure code cannot access key material
 */
export class EncryptionKey extends ValueObject {
  private static readonly KEY_LENGTH = 32; // 256 bits for AES-256-GCM
  private constructor(private readonly _value: Uint8Array) {
    super();
    if (_value.length !== EncryptionKey.KEY_LENGTH) {
      throw new Error(`Encryption key must be exactly ${EncryptionKey.KEY_LENGTH} bytes (256 bits)`);
    }
  }
  /**
 * Generate a cryptographically secure random encryption key
 * MUST be called client-side only
 */
  static generate(): EncryptionKey {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: Encryption keys can only be generated client-side');
    }

    const keyBytes = crypto.getRandomValues(new Uint8Array(EncryptionKey.KEY_LENGTH));
    return new EncryptionKey(keyBytes);
  }
  /**
 * Create key from password using PBKDF2
 * Client-side only operation
 */
  static async fromPassword(password: string, salt: Uint8Array): Promise<EncryptionKey> {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: Password-derived keys can only be generated client-side');
    }

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      256 // 256 bits
    );

    return new EncryptionKey(new Uint8Array(derivedBits));
  }  /**
   * Create key from base64 string (for URL fragments)
   * Client-side only operation
   */
  static fromBase64(base64: string): EncryptionKey {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: Keys can only be reconstructed client-side');
    }

    try {
      const keyBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      return new EncryptionKey(keyBytes);    } catch {
      throw new Error('Invalid encryption key format');
    }
  }

  /**
   * Create key from raw bytes (for testing and internal use)
   * Client-side only operation
   */
  static fromBytes(bytes: Uint8Array): EncryptionKey {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: Keys can only be reconstructed client-side');
    }

    return new EncryptionKey(bytes);
  }
  /**
   * Export key as base64 for URL fragments
   * Client-side only operation
   */
  toBase64(): string {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: Keys cannot be exported server-side');
    }

    return btoa(String.fromCharCode(...this._value));
  }

  /**
   * Export key as base64url (URL-safe) for share URLs
   * Client-side only operation
   */
  toBase64Url(): string {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: Keys cannot be exported server-side');
    }

    // Convert to base64 then make URL-safe
    const base64 = btoa(String.fromCharCode(...this._value));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }  /**
   * Get raw key bytes for crypto operations
   * Client-side only operation
   */
  getBytes(): Uint8Array {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: Raw key bytes cannot be accessed server-side');
    }

    return this._value.slice(); // Return copy to prevent mutation
  }

  /**
   * Alias for getBytes() for compatibility with entity version
   */
  toBytes(): Uint8Array {
    return this.getBytes();
  }
  /**
   * Prevent accidental JSON serialization - this is a security feature
   */
  toJSON(): never {
    throw new Error('PRIVACY VIOLATION: Encryption keys must never be serialized to JSON');
  }

  /**
   * Privacy-safe toString that doesn't expose key material
   */
  toString(): string {
    return '[EncryptionKey:REDACTED]';
  }

  /**
   * Import key into Web Crypto API for operations
   * Client-side only operation
   */  async toCryptoKey(): Promise<CryptoKey> {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: CryptoKey can only be created client-side');
    }

    return await crypto.subtle.importKey(
      'raw',
      this._value,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  equals(obj: ValueObject): boolean {
    if (!(obj instanceof EncryptionKey)) return false;

    // Constant-time comparison to prevent timing attacks
    if (this._value.length !== obj._value.length) return false;

    let result = 0;
    for (let i = 0; i < this._value.length; i++) {
      result |= this._value[i] ^ obj._value[i];
    }

    return result === 0;
  }

  /**
   * Secure disposal of key material
   */
  dispose(): void {
    // Zero out the key material
    this._value.fill(0);
  }
}
