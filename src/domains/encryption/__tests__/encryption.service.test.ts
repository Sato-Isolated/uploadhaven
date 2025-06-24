/**
 * 🧪 EncryptionService Tests
 * 
 * Comprehensive tests for the zero-knowledge encryption service.
 * Tests the critical encryption/decryption flow and bug fixes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../infrastructure/crypto/encryption.service';
import { EncryptionKey } from '../domain/value-objects/EncryptionKey';
import { InitializationVector } from '../domain/value-objects/InitializationVector';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let testKey: EncryptionKey;
  let testFile: File;

  beforeEach(() => {
    service = new EncryptionService();
    testKey = EncryptionKey.generate();
    testFile = new File(['Hello, test world!'], 'test.txt', { type: 'text/plain' });
  });

  describe('Service Instantiation', () => {
    it('should exist and be importable', () => {
      expect(EncryptionService).toBeDefined();
    });

    it('should be instantiable', () => {
      const service = new EncryptionService();
      expect(service).toBeInstanceOf(EncryptionService);
    });
  });

  describe('Key Generation', () => {
    it('should generate random encryption keys', () => {
      const key1 = service.generateKey();
      const key2 = service.generateKey();

      expect(key1).toBeInstanceOf(EncryptionKey);
      expect(key2).toBeInstanceOf(EncryptionKey);
      expect(key1.toBase64()).not.toBe(key2.toBase64());
    });

    it('should derive consistent keys from passwords', async () => {
      const password = 'test-password';
      const salt = service.generateSalt();

      const result1 = await service.deriveKeyFromPassword(password, salt);
      const result2 = await service.deriveKeyFromPassword(password, salt);

      expect(result1.key.toBase64()).toBe(result2.key.toBase64());
      expect(result1.salt).toEqual(result2.salt);
    });
  });

  describe('File Encryption (Critical Bug Fix)', () => {
    it('should encrypt file and return consistent IV', async () => {
      const result = await service.encryptFile(testFile, testKey);

      expect(result.encryptedData).toBeInstanceOf(Uint8Array);
      expect(result.encryptedData.length).toBeGreaterThan(0);
      expect(result.iv).toBeInstanceOf(InitializationVector);
      expect(result.originalMetadata.filename).toBe('test.txt');
      expect(result.originalMetadata.mimeType).toBe('text/plain');
      expect(result.originalMetadata.size).toBe(testFile.size);
    });

    it('should use the same IV for encryption and decryption (bug fix)', async () => {
      // This test validates the critical IV consistency bug fix
      const encryptResult = await service.encryptFile(testFile, testKey);
      
      // The IV returned should be the one actually used for encryption
      const decryptResult = await service.decryptData(
        encryptResult.encryptedData,
        testKey,
        encryptResult.iv
      );

      // If IV is consistent, decryption should succeed
      expect(decryptResult).toBeInstanceOf(Uint8Array);
      expect(decryptResult.length).toBeGreaterThan(0);

      // Verify the decrypted content matches original
      const originalData = await testFile.arrayBuffer();
      expect(decryptResult).toEqual(new Uint8Array(originalData));
    });

    it('should generate different IVs for each encryption', async () => {
      const result1 = await service.encryptFile(testFile, testKey);
      const result2 = await service.encryptFile(testFile, testKey);

      expect(result1.iv.getBytes()).not.toEqual(result2.iv.getBytes());
      expect(result1.encryptedData).not.toEqual(result2.encryptedData);
    });
  });

  describe('Data Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5]);
      
      const encryptResult = await service.encryptData(originalData, testKey);
      expect(encryptResult.encryptedData).toBeInstanceOf(Uint8Array);
      expect(encryptResult.iv).toBeInstanceOf(InitializationVector);

      const decryptedData = await service.decryptData(
        encryptResult.encryptedData, 
        testKey, 
        encryptResult.iv
      );

      expect(decryptedData).toEqual(originalData);
    });

    it('should fail decryption with wrong key', async () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5]);
      const wrongKey = EncryptionKey.generate();
      
      const encryptResult = await service.encryptData(originalData, testKey);

      await expect(
        service.decryptData(encryptResult.encryptedData, wrongKey, encryptResult.iv)
      ).rejects.toThrow();
    });

    it('should fail decryption with wrong IV', async () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5]);
      const wrongIV = InitializationVector.generate();
      
      const encryptResult = await service.encryptData(originalData, testKey);

      await expect(
        service.decryptData(encryptResult.encryptedData, testKey, wrongIV)
      ).rejects.toThrow();
    });
  });

  describe('Complete File Encrypt/Decrypt Cycle', () => {
    it('should complete full file encryption and decryption cycle', async () => {
      // Create test file
      const originalContent = 'This is a test file for encryption';
      const originalFile = new File([originalContent], 'test.txt', { type: 'text/plain' });

      // Encrypt file
      const encryptResult = await service.encryptFile(originalFile, testKey);

      // Decrypt data
      const decryptedData = await service.decryptData(
        encryptResult.encryptedData,
        testKey,
        encryptResult.iv
      );

      // Verify content matches
      const decryptedContent = new TextDecoder().decode(decryptedData);
      expect(decryptedContent).toBe(originalContent);
      
      // Verify metadata
      expect(encryptResult.originalMetadata.filename).toBe('test.txt');
      expect(encryptResult.originalMetadata.mimeType).toBe('text/plain');
      expect(encryptResult.originalMetadata.size).toBe(originalFile.size);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate encryption parameters', async () => {
      const validParams = {
        fileSize: 1024,
        algorithm: 'AES-256-GCM',
        keyLength: 32
      };

      const result = await service.validateEncryptionParams(validParams);
      expect(result).toBe(true);
    });

    it('should reject files that are too large', async () => {
      const invalidParams = {
        fileSize: 200 * 1024 * 1024, // 200MB (over limit)
        algorithm: 'AES-256-GCM',
        keyLength: 32
      };

      const result = await service.validateEncryptionParams(invalidParams);
      expect(result).toBe(false);
    });

    it('should reject unsupported algorithms', async () => {
      const invalidParams = {
        fileSize: 1024,
        algorithm: 'AES-128-CBC', // Unsupported
        keyLength: 32
      };

      const result = await service.validateEncryptionParams(invalidParams);
      expect(result).toBe(false);
    });
  });

  describe('Browser Support Detection', () => {
    it('should detect browser crypto support', () => {
      const support = service.checkBrowserSupport();
      
      // In test environment, crypto should be available
      expect(support.supported).toBe(true);
      expect(support.missingFeatures).toEqual([]);
    });
  });

  describe('Salt Generation', () => {
    it('should generate cryptographically secure salts', () => {
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();

      expect(salt1).toBeInstanceOf(Uint8Array);
      expect(salt1.length).toBe(16); // 128-bit salt
      expect(salt1).not.toEqual(salt2); // Should be random
    });
  });
});