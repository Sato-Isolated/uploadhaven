/**
 * 🧪 EncryptionKey Entity Tests
 * 
 * Tests for zero-knowledge encryption key management.
 * Validates privacy patterns and security requirements.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptionKey } from '../domain/value-objects/EncryptionKey';

describe('EncryptionKey Entity', () => {
  let testKey: EncryptionKey;

  beforeEach(() => {
    testKey = EncryptionKey.generate();
  });

  afterEach(() => {
    // Clean up key material
    testKey?.dispose();
  });

  describe('Key Generation', () => {
    it('should generate a random 256-bit encryption key', () => {
      const key = EncryptionKey.generate();
      const keyBytes = key.toBytes();

      expect(keyBytes).toBeInstanceOf(Uint8Array);
      expect(keyBytes.length).toBe(32); // 256 bits = 32 bytes
      expect(keyBytes.some(byte => byte !== 0)).toBe(true); // Should not be all zeros
    });

    it('should generate different keys each time', () => {
      const key1 = EncryptionKey.generate();
      const key2 = EncryptionKey.generate();

      expect(key1.equals(key2)).toBe(false);

      key1.dispose();
      key2.dispose();
    });
  });

  describe('Password-based Key Derivation', () => {
    it('should derive consistent key from password and salt', async () => {
      const password = 'test-password-123';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

      const key1 = await EncryptionKey.fromPassword(password, salt);
      const key2 = await EncryptionKey.fromPassword(password, salt);

      expect(key1.equals(key2)).toBe(true);

      key1.dispose();
      key2.dispose();
    }); it('should derive different keys for different passwords', async () => {
      const salt = new Uint8Array(16).fill(1);

      const key1 = await EncryptionKey.fromPassword('password1', salt);
      const key2 = await EncryptionKey.fromPassword('password2', salt);

      expect(key1.equals(key2)).toBe(false);

      key1.dispose();
      key2.dispose();
    });

    it('should derive different keys for different salts', async () => {
      const password = 'same-password';
      const salt1 = new Uint8Array(16).fill(1);
      const salt2 = new Uint8Array(16).fill(2);

      const key1 = await EncryptionKey.fromPassword(password, salt1);
      const key2 = await EncryptionKey.fromPassword(password, salt2);

      expect(key1.equals(key2)).toBe(false);

      key1.dispose();
      key2.dispose();
    });
  });

  describe('Key Serialization (Privacy-Safe)', () => {
    it('should convert key to base64 for URL fragments', () => {
      const key = EncryptionKey.generate();
      const base64 = key.toBase64();

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => atob(base64)).not.toThrow();

      key.dispose();
    });

    it('should reconstruct key from base64', () => {
      const originalKey = EncryptionKey.generate();
      const base64 = originalKey.toBase64();
      const reconstructedKey = EncryptionKey.fromBase64(base64);

      expect(originalKey.equals(reconstructedKey)).toBe(true);

      originalKey.dispose();
      reconstructedKey.dispose();
    });

    it('should convert key to bytes for cryptographic operations', () => {
      const key = EncryptionKey.generate();
      const bytes = key.toBytes();

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);

      // Should be able to reconstruct
      const reconstructedKey = EncryptionKey.fromBytes(bytes);
      expect(key.equals(reconstructedKey)).toBe(true);

      key.dispose();
      reconstructedKey.dispose();
    });
  });

  describe('Privacy Protection', () => {
    it('should not expose key material in toString()', () => {
      const key = EncryptionKey.generate();
      const stringValue = key.toString();

      expect(stringValue).toBe('[EncryptionKey:REDACTED]');
      expect(stringValue).not.toContain('Uint8Array');
      expect(stringValue).not.toContain('ArrayBuffer');

      key.dispose();
    });

    it('should prevent JSON serialization to avoid accidental transmission', () => {
      const key = EncryptionKey.generate();

      expect(() => JSON.stringify(key)).toThrow('PRIVACY VIOLATION: Encryption keys must never be serialized to JSON');
      expect(() => key.toJSON()).toThrow('PRIVACY VIOLATION: Encryption keys must never be serialized to JSON');

      key.dispose();
    });

    it('should securely dispose of key material', () => {
      const key = EncryptionKey.generate();
      const originalBytes = key.toBytes();

      // Dispose of key
      key.dispose();

      // Original bytes should be different after disposal
      const bytesAfterDisposal = key.toBytes();
      expect(originalBytes).not.toEqual(bytesAfterDisposal);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid key sizes', () => {
      const invalidKey = new Uint8Array(16); // 128 bits - too small

      expect(() => EncryptionKey.fromBytes(invalidKey)).toThrow('Encryption key must be exactly 32 bytes (256 bits)');
    });

    it('should reject empty keys', () => {
      const emptyKey = new Uint8Array(0);

      expect(() => EncryptionKey.fromBytes(emptyKey)).toThrow('Encryption key must be exactly 32 bytes (256 bits)');
    });

    it('should reject oversized keys', () => {
      const oversizedKey = new Uint8Array(64); // 512 bits - too large

      expect(() => EncryptionKey.fromBytes(oversizedKey)).toThrow('Encryption key must be exactly 32 bytes (256 bits)');
    });

    it('should handle invalid base64 gracefully', () => {
      const invalidBase64 = 'not-valid-base64!!!';

      expect(() => EncryptionKey.fromBase64(invalidBase64)).toThrow();
    });
  });

  describe('Equality Checking', () => {
    it('should correctly identify equal keys', () => {
      const key1 = EncryptionKey.generate();
      const bytes = key1.toBytes();
      const key2 = EncryptionKey.fromBytes(bytes);

      expect(key1.equals(key2)).toBe(true);

      key1.dispose();
      key2.dispose();
    });

    it('should correctly identify different keys', () => {
      const key1 = EncryptionKey.generate();
      const key2 = EncryptionKey.generate();

      expect(key1.equals(key2)).toBe(false);

      key1.dispose();
      key2.dispose();
    });
  });
});
