import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptFileUseCase } from '../application/usecases/EncryptFileUseCase';
import { WebCryptoEncryptionService } from '../infrastructure/crypto/WebCryptoEncryptionService';
import { EncryptionKey } from '../domain/value-objects/EncryptionKey';

/**
 * Comprehensive tests for EncryptFileUseCase
 * 
 * CRITICAL: These tests validate zero-knowledge guarantees and privacy patterns
 */

// Mock browser environment for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      importKey: vi.fn(),
      deriveBits: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn()
    }
  }
});

Object.defineProperty(global, 'window', {
  value: {
    location: {
      origin: 'https://uploadhaven.test'
    }
  }
});

Object.defineProperty(global, 'TextEncoder', {
  value: class TextEncoder {
    encode(str: string) {
      return new Uint8Array(Buffer.from(str, 'utf8'));
    }
  }
});

Object.defineProperty(global, 'TextDecoder', {
  value: class TextDecoder {
    decode(arr: Uint8Array) {
      return Buffer.from(arr).toString('utf8');
    }
  }
});

describe('EncryptFileUseCase', () => {
  let encryptionService: WebCryptoEncryptionService;
  let encryptFileUseCase: EncryptFileUseCase;
  let testFile: File;

  beforeEach(() => {
    // Setup test environment
    encryptionService = new WebCryptoEncryptionService();
    encryptFileUseCase = new EncryptFileUseCase(encryptionService, 'https://uploadhaven.test');

    // Create test file
    testFile = new File(['Test file content'], 'test.txt', {
      type: 'text/plain'
    });
    // Mock encryption service methods
    vi.spyOn(encryptionService, 'generateKey').mockReturnValue(
      EncryptionKey.fromBase64('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=')
    );

    vi.spyOn(encryptionService, 'encryptFile').mockResolvedValue({
      encryptedData: new Uint8Array([1, 2, 3, 4, 5]),
      iv: { getBytes: () => new Uint8Array([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) } as any,
      originalMetadata: {
        filename: 'test.txt',
        mimeType: 'text/plain',
        size: 17
      }
    });
  });

  describe('Privacy Guarantees', () => {
    it('should never expose encryption keys to server-side code', async () => {
      const result = await encryptFileUseCase.execute({ file: testFile });
      // Share URL base should NOT contain the encryption key
      expect(result.shareUrlBase).not.toContain(result.keyForUrl);
      expect(result.shareUrlBase).toMatch(/^https:\/\/uploadhaven\.test\/s\/[a-zA-Z0-9-]+$/);

      // Key should be provided separately for client-side URL fragment
      expect(result.keyForUrl).toBeTruthy();
      expect(typeof result.keyForUrl).toBe('string');
    });

    it('should enforce client-side only encryption', () => {
      // This test validates that the use case maintains zero-knowledge principles
      expect(() => new WebCryptoEncryptionService()).not.toThrow();

      // The encryption service should enforce client-side only operations
      expect(encryptionService.checkBrowserSupport()).toEqual({
        supported: true,
        missingFeatures: []
      });
    });

    it('should create encrypted file entity with privacy-safe metadata only', async () => {
      const result = await encryptFileUseCase.execute({ file: testFile });

      // Encrypted file should contain only public metadata
      expect(result.encryptedFile.encryptedSize).toBeGreaterThan(0);
      expect(result.encryptedFile.expiresAt).toBeInstanceOf(Date);
      expect(result.encryptedFile.maxDownloads).toBeGreaterThan(0);

      // Should NOT contain original filename or content in entity
      expect(result.encryptedFile.toString()).not.toContain('test.txt');
      expect(result.encryptedFile.toString()).not.toContain('Test file content');
    });
  });

  describe('Validation', () => {
    it('should reject empty files', async () => {
      const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });

      await expect(encryptFileUseCase.execute({ file: emptyFile }))
        .rejects.toThrow('File cannot be empty');
    });

    it('should reject files larger than anonymous limit (100MB)', async () => {
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.txt');
      Object.defineProperty(largeFile, 'size', { value: 101 * 1024 * 1024 });

      await expect(encryptFileUseCase.execute({ file: largeFile }))
        .rejects.toThrow('File size cannot exceed 100MB for anonymous uploads');
    });

    it('should validate expiration hours for anonymous uploads', async () => {
      await expect(encryptFileUseCase.execute({
        file: testFile,
        expirationHours: 0
      })).rejects.toThrow('Expiration hours must be between 1 and 168');

      await expect(encryptFileUseCase.execute({
        file: testFile,
        expirationHours: 169
      })).rejects.toThrow('Expiration hours must be between 1 and 168');
    });

    it('should validate max downloads', async () => {
      await expect(encryptFileUseCase.execute({
        file: testFile,
        maxDownloads: 0
      })).rejects.toThrow('Max downloads must be between 1 and 1000');

      await expect(encryptFileUseCase.execute({
        file: testFile,
        maxDownloads: 1001
      })).rejects.toThrow('Max downloads must be between 1 and 1000');
    });

    it('should validate password length when provided', async () => {
      await expect(encryptFileUseCase.execute({
        file: testFile,
        password: '1234567' // 7 chars - too short
      })).rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('Encryption Options', () => {
    it('should use default values for anonymous uploads', async () => {
      const result = await encryptFileUseCase.execute({ file: testFile });

      expect(result.metadata.maxDownloads).toBe(10);

      // Should expire in ~24 hours (allowing some test execution time)
      const expectedExpiration = Date.now() + (24 * 60 * 60 * 1000);
      const actualExpiration = result.metadata.expiresAt.getTime();
      expect(Math.abs(actualExpiration - expectedExpiration)).toBeLessThan(1000);
    });

    it('should accept custom expiration and download limits', async () => {
      const result = await encryptFileUseCase.execute({
        file: testFile,
        expirationHours: 48,
        maxDownloads: 5
      });

      expect(result.metadata.maxDownloads).toBe(5);

      // Should expire in ~48 hours
      const expectedExpiration = Date.now() + (48 * 60 * 60 * 1000);
      const actualExpiration = result.metadata.expiresAt.getTime();
      expect(Math.abs(actualExpiration - expectedExpiration)).toBeLessThan(1000);
    });

    it('should handle password-protected encryption', async () => {
      const password = 'supersecretpassword123';
      // Mock password-based key derivation with a valid 32-byte key
      vi.spyOn(encryptionService, 'deriveKeyFromPassword').mockResolvedValue({
        key: EncryptionKey.fromBase64('cGFzc3dvcmRkZXJpdmVka2V5MTIzNDU2NzhhYmNkZWY='),
        salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      });

      const result = await encryptFileUseCase.execute({
        file: testFile,
        password
      });

      expect(encryptionService.deriveKeyFromPassword).toHaveBeenCalledWith(
        password,
        expect.any(Uint8Array)
      );
      expect(result.keyForUrl).toBeTruthy();
    });
  });

  describe('Result Structure', () => {
    it('should return complete encryption result with metadata', async () => {
      const result = await encryptFileUseCase.execute({ file: testFile });

      // Validate result structure
      expect(result).toHaveProperty('encryptedFile');
      expect(result).toHaveProperty('encryptionKey');
      expect(result).toHaveProperty('shareUrlBase');
      expect(result).toHaveProperty('keyForUrl');
      expect(result).toHaveProperty('metadata');

      // Validate metadata
      expect(result.metadata.originalFilename).toBe('test.txt');
      expect(result.metadata.originalSize).toBe(17);
      expect(result.metadata.encryptedSize).toBe(5); // Mock encrypted data length
      expect(result.metadata.algorithm).toBe('AES-256-GCM');
      expect(result.metadata.expiresAt).toBeInstanceOf(Date);
      expect(result.metadata.maxDownloads).toBeGreaterThan(0);
    });

    it('should generate valid share URL structure', async () => {
      const result = await encryptFileUseCase.execute({ file: testFile });
      // Base URL should follow pattern
      expect(result.shareUrlBase).toMatch(/^https:\/\/uploadhaven\.test\/s\/[a-zA-Z0-9-]+$/);
      // Should be able to construct complete share URL
      const completeShareUrl = `${result.shareUrlBase}#${result.keyForUrl}`;
      expect(completeShareUrl).toMatch(/^https:\/\/uploadhaven\.test\/s\/[a-zA-Z0-9-]+#.+$/);
    });
  });

  describe('Zero-Knowledge Validation', () => {
    it('should ensure server cannot access encryption keys', async () => {
      const result = await encryptFileUseCase.execute({ file: testFile });

      // The encrypted file entity should not contain key material
      const fileJson = JSON.stringify(result.encryptedFile);
      expect(fileJson).not.toContain(result.keyForUrl);

      // Only encrypted blob and public metadata should be in entity
      expect(result.encryptedFile.encryptedBlob).toBeInstanceOf(Uint8Array);
      expect(result.encryptedFile.iv).toBeDefined();
      expect(result.encryptedFile.encryptedSize).toBeGreaterThan(0);
    });

    it('should maintain key separation for URL construction', async () => {
      const result = await encryptFileUseCase.execute({ file: testFile });

      // Share URL base and key should be provided separately
      expect(result.shareUrlBase).not.toContain('#');
      expect(result.keyForUrl).not.toContain('#');
      expect(result.keyForUrl).not.toContain('/');

      // Client should combine them: ${shareUrlBase}#${keyForUrl}
      const completeUrl = `${result.shareUrlBase}#${result.keyForUrl}`;
      expect(completeUrl.split('#')).toHaveLength(2);
    });
  });
});
