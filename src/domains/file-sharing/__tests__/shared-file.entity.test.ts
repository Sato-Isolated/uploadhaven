/**
 * SharedFile Entity Tests
 * 
 * Tests the SharedFile entity business logic and privacy guarantees.
 * Validates zero-knowledge principles and domain constraints.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SharedFile } from '../domain/entities/shared-file.entity';
import { EncryptedFile } from '../../encryption/domain/entities/encrypted-file.entity';
import { EncryptionKey } from '../../encryption/domain/value-objects/EncryptionKey';

describe('SharedFile Entity', () => {
  let encryptedFile: EncryptedFile;
  let sharedFile: SharedFile;

  beforeEach(async () => {
    // Create test encrypted file
    const key = EncryptionKey.generate();
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    encryptedFile = await EncryptedFile.createFromFile(testFile, key);

    // Create test shared file
    sharedFile = await SharedFile.createAnonymous(encryptedFile);
  });

  describe('Creation', () => {
    it('should create anonymous shared file with defaults', async () => {
      const shared = await SharedFile.createAnonymous(encryptedFile);

      expect(shared.id).toMatch(/^[A-Za-z0-9\-_]{10}$/);
      expect(shared.size).toBe(encryptedFile.serverMetadata.encryptedSize);
      expect(shared.maxDownloads).toBe(10);
      expect(shared.downloadCount).toBe(0);
      expect(shared.isAvailable).toBe(true);
    });

    it('should create shared file with custom parameters', async () => {
      const shared = await SharedFile.createAnonymous(encryptedFile, 48, 5);

      expect(shared.maxDownloads).toBe(5);
      // TTL should be ~48 hours from now
      const expectedExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const timeDiff = Math.abs(shared.expiresAt.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    }); it('should generate unique IDs for different files', async () => {
      // Create two different encrypted files with different keys
      const key1 = EncryptionKey.generate();
      const key2 = EncryptionKey.generate();

      const testFile1 = new File(['test content 1'], 'test1.txt', { type: 'text/plain' });
      const testFile2 = new File(['test content 2'], 'test2.txt', { type: 'text/plain' });

      const encryptedFile1 = await EncryptedFile.createFromFile(testFile1, key1);
      const encryptedFile2 = await EncryptedFile.createFromFile(testFile2, key2);

      const shared1 = await SharedFile.createAnonymous(encryptedFile1);
      const shared2 = await SharedFile.createAnonymous(encryptedFile2);

      expect(shared1.id).not.toBe(shared2.id);
    });
  });

  describe('Business Logic', () => {
    it('should record downloads correctly', () => {
      expect(sharedFile.downloadCount).toBe(0);
      expect(sharedFile.remainingDownloads).toBe(10);

      sharedFile.recordDownload();

      expect(sharedFile.downloadCount).toBe(1);
      expect(sharedFile.remainingDownloads).toBe(9);
    });

    it('should prevent downloads when limit exceeded', () => {
      // Exhaust downloads
      for (let i = 0; i < 10; i++) {
        sharedFile.recordDownload();
      }

      expect(sharedFile.remainingDownloads).toBe(0);
      expect(() => sharedFile.recordDownload()).toThrow('Download limit exceeded');
    });

    it('should handle soft deletion', () => {
      expect(sharedFile.isDeleted).toBe(false);
      expect(sharedFile.isAvailable).toBe(true);

      sharedFile.markAsDeleted();

      expect(sharedFile.isDeleted).toBe(true);
      expect(sharedFile.isAvailable).toBe(false);
    });

    it('should prevent downloads of deleted files', () => {
      sharedFile.markAsDeleted();

      expect(() => sharedFile.recordDownload()).toThrow('File has been deleted');
    });

    it('should detect when auto-deletion is needed', () => {
      expect(sharedFile.shouldAutoDelete()).toBe(false);

      // Exhaust downloads
      for (let i = 0; i < 10; i++) {
        sharedFile.recordDownload();
      }

      expect(sharedFile.shouldAutoDelete()).toBe(true);
    });
  });

  describe('Privacy Guarantees', () => {
    it('should not expose sensitive data in storage representation', () => {
      const storageData = sharedFile.toStorageData();

      expect(storageData).toHaveProperty('id');
      expect(storageData).toHaveProperty('encryptedBlob');
      expect(storageData).toHaveProperty('iv');
      expect(storageData).toHaveProperty('size');
      expect(storageData).toHaveProperty('createdAt');
      expect(storageData).toHaveProperty('expiresAt');

      // Should NOT have sensitive data
      expect(storageData).not.toHaveProperty('originalFilename');
      expect(storageData).not.toHaveProperty('mimeType');
      expect(storageData).not.toHaveProperty('userAgent');
      expect(storageData).not.toHaveProperty('ipAddress');
    });

    it('should not expose sensitive data in public metadata', () => {
      const publicData = sharedFile.toPublicMetadata();

      expect(publicData).toHaveProperty('id');
      expect(publicData).toHaveProperty('size');
      expect(publicData).toHaveProperty('expiresAt');
      expect(publicData).toHaveProperty('remainingDownloads');
      expect(publicData).toHaveProperty('isAvailable');

      // Should NOT have encrypted blob or IV
      expect(publicData).not.toHaveProperty('encryptedBlob');
      expect(publicData).not.toHaveProperty('iv');
    });

    it('should not expose sensitive data in string representation', () => {
      const stringRep = sharedFile.toString();

      expect(stringRep).toContain('SharedFile');
      expect(stringRep).toContain(sharedFile.id);
      expect(stringRep).toContain(sharedFile.size.toString());

      // Should not contain sensitive data
      expect(stringRep).not.toContain('encryptedBlob');
      expect(stringRep).not.toContain('key');
    });
  });

  describe('TTL Extension', () => {
    it('should extend TTL when not deleted', () => {
      const originalExpiry = sharedFile.expiresAt;

      sharedFile.extendTTL(24);

      const expectedExpiry = new Date(originalExpiry.getTime() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(sharedFile.expiresAt.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should prevent TTL extension of deleted files', () => {
      sharedFile.markAsDeleted();

      expect(() => sharedFile.extendTTL(24)).toThrow('Cannot extend TTL of deleted file');
    });
  });

  describe('Reconstitution from Storage', () => {
    it('should reconstitute from stored data correctly', () => {
      const storageData = sharedFile.toStorageData();

      const reconstituted = SharedFile.fromStoredData(
        storageData.id,
        encryptedFile,
        storageData.size,
        storageData.createdAt,
        storageData.expiresAt,
        storageData.maxDownloads,
        storageData.downloadCount,
        storageData.isDeleted
      );

      expect(reconstituted.id).toBe(sharedFile.id);
      expect(reconstituted.size).toBe(sharedFile.size);
      expect(reconstituted.maxDownloads).toBe(sharedFile.maxDownloads);
      expect(reconstituted.downloadCount).toBe(sharedFile.downloadCount);
      expect(reconstituted.isDeleted).toBe(sharedFile.isDeleted);
    });
  });
});
