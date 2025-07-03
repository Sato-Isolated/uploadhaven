import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileEntity } from '../file-entity';
import { EntityUtils } from '../../shared/base-entity';

// Mock EntityUtils
vi.mock('../../shared/base-entity', () => ({
  EntityUtils: {
    generateId: vi.fn().mockReturnValue('mock-file-id'),
    calculateExpirationDate: vi.fn().mockImplementation((hours) => {
      const date = new Date();
      date.setHours(date.getHours() + hours);
      return date;
    }),
    isExpired: vi.fn().mockImplementation((date) => new Date() > date)
  }
}));

describe('FileEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset date to a fixed point for consistent testing
    vi.setSystemTime(new Date('2025-01-07T10:00:00Z'));
  });

  describe('File creation', () => {
    it('should create a file with required parameters', () => {
      const file = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        encryptedPath: '/path/to/encrypted/file',
        expirationHours: 24
      });

      expect(file.id).toBe('mock-file-id');
      expect(file.originalName).toBe('test.txt');
      expect(file.mimeType).toBe('text/plain');
      expect(file.size).toBe(1024);
      expect(file.encryptedPath).toBe('/path/to/encrypted/file');
      expect(file.downloadCount).toBe(0);
      expect(file.passwordHash).toBeUndefined();
    });

    it('should create a file with optional parameters', () => {
      const file = FileEntity.create({
        originalName: 'secure.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        encryptedPath: '/path/to/secure/file',
        expirationHours: 48,
        maxDownloads: 5,
        passwordHash: 'hashed-password'
      });

      expect(file.maxDownloads).toBe(5);
      expect(file.passwordHash).toBe('hashed-password');
      expect(EntityUtils.calculateExpirationDate).toHaveBeenCalledWith(48);
    });

    it('should generate unique IDs for different files', () => {
      vi.mocked(EntityUtils.generateId)
        .mockReturnValueOnce('file-1')
        .mockReturnValueOnce('file-2');

      const file1 = FileEntity.create({
        originalName: 'file1.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path1',
        expirationHours: 24
      });

      const file2 = FileEntity.create({
        originalName: 'file2.txt',
        mimeType: 'text/plain',
        size: 200,
        encryptedPath: '/path2',
        expirationHours: 24
      });

      expect(file1.id).toBe('file-1');
      expect(file2.id).toBe('file-2');
    });
  });

  describe('File metadata conversion', () => {
    it('should convert to metadata correctly', () => {
      const file = FileEntity.create({
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 5120,
        encryptedPath: '/encrypted/doc.bin',
        expirationHours: 72,
        maxDownloads: 10,
        passwordHash: 'secure-hash'
      });

      const metadata = file.toMetadata();

      expect(metadata).toEqual({
        id: 'mock-file-id',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 5120,
        encryptedPath: '/encrypted/doc.bin',
        uploadedAt: expect.any(Date),
        expiresAt: expect.any(Date),
        downloadCount: 0,
        maxDownloads: 10,
        passwordHash: 'secure-hash'
      });
    });

    it('should create file from metadata', () => {
      const metadata = {
        id: 'existing-file-id',
        originalName: 'existing.txt',
        mimeType: 'text/plain',
        size: 512,
        encryptedPath: '/existing/path',
        uploadedAt: new Date('2025-01-06T10:00:00Z'),
        expiresAt: new Date('2025-01-08T10:00:00Z'),
        downloadCount: 3,
        maxDownloads: 5,
        passwordHash: 'existing-hash'
      };

      const file = FileEntity.fromMetadata(metadata);

      expect(file.id).toBe('existing-file-id');
      expect(file.originalName).toBe('existing.txt');
      expect(file.downloadCount).toBe(3);
      expect(file.maxDownloads).toBe(5);
    });
  });

  describe('File access control', () => {
    it('should allow access to valid, unexpired file', () => {
      vi.mocked(EntityUtils.isExpired).mockReturnValue(false);
      
      const file = FileEntity.create({
        originalName: 'valid.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        expirationHours: 24,
        maxDownloads: 5
      });

      expect(file.canBeAccessed()).toBe(true);
      expect(file.canBeDownloaded()).toBe(true);
    });

    it('should deny access to expired file', () => {
      vi.mocked(EntityUtils.isExpired).mockReturnValue(true);
      
      const file = FileEntity.create({
        originalName: 'expired.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        expirationHours: 24
      });

      expect(file.isExpired()).toBe(true);
      expect(file.canBeAccessed()).toBe(false);
      expect(file.canBeDownloaded()).toBe(false);
    });

    it('should deny access when max downloads reached', () => {
      vi.mocked(EntityUtils.isExpired).mockReturnValue(false);
      
      const metadata = {
        id: 'file-id',
        originalName: 'popular.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        downloadCount: 5,
        maxDownloads: 5
      };

      const file = FileEntity.fromMetadata(metadata);

      expect(file.hasReachedMaxCount()).toBe(true);
      expect(file.hasReachedMaxDownloads()).toBe(true);
      expect(file.canBeAccessed()).toBe(false);
      expect(file.canBeDownloaded()).toBe(false);
    });

    it('should allow access when no max downloads limit is set', () => {
      vi.mocked(EntityUtils.isExpired).mockReturnValue(false);
      
      const metadata = {
        id: 'file-id',
        originalName: 'unlimited.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        downloadCount: 100
        // No maxDownloads set
      };

      const file = FileEntity.fromMetadata(metadata);

      expect(file.hasReachedMaxCount()).toBe(false);
      expect(file.canBeAccessed()).toBe(true);
    });
  });

  describe('Download count management', () => {
    it('should increment download count', () => {
      const file = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        expirationHours: 24
      });

      const updatedFile = file.incrementCount();

      expect(updatedFile.downloadCount).toBe(1);
      expect(file.downloadCount).toBe(0); // Original should be unchanged
      expect(updatedFile.id).toBe(file.id); // Should maintain same ID
    });

    it('should increment multiple times', () => {
      let file = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        expirationHours: 24
      });

      file = file.incrementCount();
      file = file.incrementCount();
      file = file.incrementDownloadCount();

      expect(file.downloadCount).toBe(3);
    });
  });

  describe('Password protection', () => {
    it('should detect password protected files', () => {
      const protectedFile = FileEntity.create({
        originalName: 'secret.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        expirationHours: 24,
        passwordHash: 'hashed-password'
      });

      const publicFile = FileEntity.create({
        originalName: 'public.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/path',
        expirationHours: 24
      });

      expect(protectedFile.isPasswordProtected()).toBe(true);
      expect(publicFile.isPasswordProtected()).toBe(false);
    });
  });

  describe('Path updates', () => {
    it('should update encrypted path while preserving other properties', () => {
      const originalFile = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 100,
        encryptedPath: '/temp/path',
        expirationHours: 24,
        maxDownloads: 5
      });

      const updatedFile = originalFile.updateEncryptedPath('/final/path');

      expect(updatedFile.encryptedPath).toBe('/final/path');
      expect(updatedFile.id).toBe(originalFile.id);
      expect(updatedFile.originalName).toBe(originalFile.originalName);
      expect(updatedFile.size).toBe(originalFile.size);
      expect(updatedFile.maxDownloads).toBe(originalFile.maxDownloads);
    });
  });

  describe('Edge cases', () => {
    it('should handle files with zero size', () => {
      const file = FileEntity.create({
        originalName: 'empty.txt',
        mimeType: 'text/plain',
        size: 0,
        encryptedPath: '/path',
        expirationHours: 24
      });

      expect(file.size).toBe(0);
      expect(file.canBeAccessed()).toBe(true);
    });

    it('should handle very large files', () => {
      const largeSize = 5 * 1024 * 1024 * 1024; // 5GB
      const file = FileEntity.create({
        originalName: 'huge.zip',
        mimeType: 'application/zip',
        size: largeSize,
        encryptedPath: '/path',
        expirationHours: 24
      });

      expect(file.size).toBe(largeSize);
    });
  });
});
