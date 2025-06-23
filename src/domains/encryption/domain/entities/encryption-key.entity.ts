/**
 * 🔐 Encryption Key Entity (Zero-Knowledge)
 * 
 * CRITICAL: This entity enforces zero-knowledge patterns.
 * Keys are NEVER stored on server, only on client-side.
 */

export class EncryptionKey {
  private constructor(private readonly _value: Uint8Array) {
    if (_value.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes (256 bits)');
    }
  }

  /**
   * ✅ SAFE: Generate random key (client-side only)
   */
  static generate(): EncryptionKey {
    const key = crypto.getRandomValues(new Uint8Array(32));
    return new EncryptionKey(key);
  }

  /**
   * ✅ SAFE: Derive key from password (client-side only)
   */
  static async deriveFromPassword(
    password: string,
    salt: Uint8Array,
    iterations: number = 100000
  ): Promise<EncryptionKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey);
    return new EncryptionKey(new Uint8Array(keyBuffer));
  }

  /**
   * ✅ SAFE: Create from existing key material (client-side only)
   */
  static fromBytes(bytes: Uint8Array): EncryptionKey {
    return new EncryptionKey(bytes);
  }

  /**
   * ✅ SAFE: Export for client-side use only
   * WARNING: Never send this to server!
   */
  toBytes(): Uint8Array {
    return new Uint8Array(this._value);
  }

  /**
   * ✅ SAFE: Export as base64 for URL fragments
   * Used in share URLs: https://uploadhaven.dev/s/fileId#base64key
   */
  toBase64(): string {
    return btoa(String.fromCharCode(...this._value));
  }

  /**
   * ✅ SAFE: Create from base64 (from URL fragment)
   */
  static fromBase64(base64: string): EncryptionKey {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return new EncryptionKey(bytes);
  }

  /**
   * ❌ FORBIDDEN: Never expose raw key value
   * This prevents accidental key leakage
   */
  toString(): string {
    return '[EncryptionKey:REDACTED]';
  }

  /**
   * ❌ FORBIDDEN: Never serialize keys
   * This prevents accidental transmission to server
   */
  toJSON(): never {
    throw new Error('PRIVACY VIOLATION: Encryption keys must never be serialized to JSON');
  }

  /**
   * ✅ SAFE: Secure disposal of key material
   */
  dispose(): void {
    // Overwrite key material with random data
    crypto.getRandomValues(this._value);
  }

  /**
   * ✅ SAFE: Key equality check for testing
   */
  equals(other: EncryptionKey): boolean {
    if (this._value.length !== other._value.length) {
      return false;
    }

    for (let i = 0; i < this._value.length; i++) {
      if (this._value[i] !== other._value[i]) {
        return false;
      }
    }

    return true;
  }
}
