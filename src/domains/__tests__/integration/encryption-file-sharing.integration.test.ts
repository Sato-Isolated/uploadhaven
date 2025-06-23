/**
 * Integration Tests - Encryption + File-Sharing Domain Interaction
 * 
 * Tests the complete flow from file encryption to anonymous sharing.
 * Validates that both domains work together with zero-knowledge principles.
 * 
 * @integration encryption + file-sharing
 * @privacy zero-knowledge - end-to-end privacy validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptFileUseCase } from '../../encryption/application/usecases/encrypt-file.usecase';
import { UploadAnonymousUseCase } from '../../file-sharing/application/usecases/upload-anonymous.usecase';
import { DownloadFileUseCase } from '../../file-sharing/application/usecases/download-file.usecase';
import { WebCryptoEncryptionService } from '../../encryption/infrastructure/crypto/WebCryptoEncryptionService';
import { SharedFile } from '../../file-sharing/domain/entities/shared-file.entity';
import { EncryptedFile } from '../../encryption/domain/entities/encrypted-file.entity';
import { FileId } from '../../file-sharing/domain/value-objects/file-id.vo';

// Mock implementations for testing
class MockFileRepository {
  // Store only privacy-safe data like the real repository would
  private storage = new Map<string, any>(); async store(sharedFile: SharedFile): Promise<void> {
    // Store only the server-safe data (like MongoDB repository does)
    const safeData = sharedFile.toStorageData();
    this.storage.set(sharedFile.id, safeData);
  } async findById(fileId: FileId): Promise<SharedFile | null> {
    const fileIdString = fileId.value; // Extract string from FileId value object
    const storedData = this.storage.get(fileIdString);
    if (!storedData) {
      return null;
    }

    // Reconstruct entity from stored data (like MongoDB repository does)
    const encryptedFile = EncryptedFile.fromStoredData(
      storedData.id,          // Pass the ID
      storedData.encryptedBlob,
      storedData.iv,
      storedData.size
    );

    return SharedFile.fromStoredData(
      storedData.id,
      encryptedFile,
      storedData.size,
      storedData.createdAt,
      storedData.expiresAt,
      storedData.maxDownloads,
      storedData.downloadCount,
      storedData.isDeleted
    );
  }

  async update(sharedFile: SharedFile): Promise<void> {
    // Update the stored data with the current file state
    const safeData = sharedFile.toStorageData();
    this.storage.set(sharedFile.id, safeData);
  }

  async updateDownloadCount(fileId: FileId): Promise<void> {
    const fileIdString = fileId.value;
    const storedData = this.storage.get(fileIdString);
    if (storedData) {
      storedData.downloadCount++;
      this.storage.set(fileIdString, storedData);
    }
  }

  async delete(fileId: FileId): Promise<void> {
    this.storage.delete(fileId.value);
  }

  async exists(fileId: FileId): Promise<boolean> {
    return this.storage.has(fileId.value);
  }

  // Make storage accessible for testing
  getStorageSize(): number {
    return this.storage.size;
  }

  getStorageContents(): Map<string, any> {
    return new Map(this.storage);
  }
}

// Mock audit service
class MockAuditService {
  async logFileUpload(): Promise<void> {
    // No-op for testing
  }
}

describe('Integration: Encryption + File-Sharing Domains', () => {
  let encryptionService: WebCryptoEncryptionService;
  let fileRepository: MockFileRepository;
  let auditService: MockAuditService;
  let encryptFileUseCase: EncryptFileUseCase;
  let uploadAnonymousUseCase: UploadAnonymousUseCase;
  let downloadFileUseCase: DownloadFileUseCase;

  beforeEach(() => {
    // Setup domain services
    encryptionService = new WebCryptoEncryptionService();
    fileRepository = new MockFileRepository();
    auditService = new MockAuditService();    // Setup use cases
    encryptFileUseCase = new EncryptFileUseCase(encryptionService);
    uploadAnonymousUseCase = new UploadAnonymousUseCase(
      fileRepository as any,
      encryptFileUseCase,
      'https://test.uploadhaven.dev'
    );
    downloadFileUseCase = new DownloadFileUseCase(
      fileRepository as any
    );
  });

  describe('Complete Anonymous Upload/Download Flow', () => {
    it('should complete upload and provide encrypted blob for download', async () => {
      // Arrange: Create test file
      const originalContent = 'This is sensitive test content that should never be visible to the server';
      const testFile = new File([originalContent], 'secret-document.txt', {
        type: 'text/plain'
      });

      // Act 1: Anonymous Upload (includes encryption)
      const uploadResult = await uploadAnonymousUseCase.execute({
        file: testFile,
        ttlHours: 24,
        maxDownloads: 5
      });

      // Assert: Upload successful with privacy guarantees
      expect(uploadResult.fileId).toBeDefined();
      expect(uploadResult.shareUrl).toMatch(/^https?:\/\/.+\/s\/.+#.+$/); // URL with fragment
      expect(uploadResult.expiresAt).toBeInstanceOf(Date);
      expect(uploadResult.maxDownloads).toBe(5);
      expect(uploadResult.size).toBeGreaterThan(0);      // Privacy Check: Server storage contains no plaintext
      const storedFile = await fileRepository.findById(FileId.fromString(uploadResult.fileId));
      expect(storedFile).toBeDefined();

      // Verify stored file doesn't expose sensitive data
      expect(storedFile!.id).toBe(uploadResult.fileId);
      expect(storedFile!.isAvailable).toBe(true);
      expect(storedFile!.downloadCount).toBe(0);      // Act 2: Parse share URL (simulating user sharing)
      const [baseUrl, keyFragment] = uploadResult.shareUrl.split('#');
      const fileId = baseUrl.split('/').pop()!;

      // Privacy Check: Key is only in fragment, not sent to server
      expect(baseUrl).not.toContain(keyFragment);
      expect(fileId).toBe(uploadResult.fileId); // Both should match since they reference the same file
      expect(fileId).toMatch(/^[a-zA-Z0-9_-]{10}$/); // Valid file ID format

      // Act 3: Anonymous Download (server returns encrypted blob only)
      const downloadResult = await downloadFileUseCase.execute({
        fileId: fileId
      });

      // Assert: Download successful and returns encrypted blob for client-side decryption
      expect(downloadResult.fileId).toBe(fileId);
      expect(downloadResult.encryptedBlob).toBeInstanceOf(Uint8Array);
      expect(downloadResult.iv).toBeDefined();
      expect(downloadResult.size).toBeGreaterThan(0);
      expect(downloadResult.downloadCount).toBe(1);
      expect(downloadResult.remainingDownloads).toBe(4);

      // Privacy Check: Encrypted blob doesn't contain original content
      const encryptedString = new TextDecoder().decode(downloadResult.encryptedBlob);
      expect(encryptedString).not.toContain('This is sensitive test content');
      expect(encryptedString).not.toContain('secret-document.txt');
    });

    it('should enforce download limits across multiple downloads', async () => {
      // Arrange: Upload file with 2 download limit
      const testFile = new File(['test'], 'test.txt');
      const uploadResult = await uploadAnonymousUseCase.execute({
        file: testFile,
        maxDownloads: 2
      });

      const fileId = uploadResult.fileId;

      // Act: Download twice (should succeed)
      const download1 = await downloadFileUseCase.execute({ fileId });
      expect(download1.downloadCount).toBe(1);

      const download2 = await downloadFileUseCase.execute({ fileId });
      expect(download2.downloadCount).toBe(2);

      // Act: Attempt third download (should fail)
      await expect(downloadFileUseCase.execute({ fileId }))
        .rejects.toThrow(/download limit|not available/i);
    });

    it('should handle password-protected files in upload', async () => {
      // Arrange: Upload with password protection
      const testFile = new File(['protected content'], 'protected.txt');
      const password = 'super-secret-password';

      const uploadResult = await uploadAnonymousUseCase.execute({
        file: testFile,
        password: password
      });

      expect(uploadResult.isPasswordProtected).toBe(true);

      // Act: Download encrypted blob (password handling is client-side in DecryptFileUseCase)
      const downloadResult = await downloadFileUseCase.execute({
        fileId: uploadResult.fileId
      });

      // Assert: Successfully returns encrypted blob (password would be used in decryption)
      expect(downloadResult.encryptedBlob).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Zero-Knowledge Privacy Guarantees', () => {
    it('should never store encryption keys on server', async () => {
      // Arrange & Act: Upload file
      const testFile = new File(['secret'], 'secret.txt');
      const uploadResult = await uploadAnonymousUseCase.execute({
        file: testFile
      });

      // Assert: Repository storage contains no keys
      const storageContents = fileRepository.getStorageContents();
      const storedFile = storageContents.get(uploadResult.fileId);
      const fileData = JSON.stringify(storedFile);

      // Check that no part of the encryption key appears in storage
      const [, keyFragment] = uploadResult.shareUrl.split('#');
      expect(fileData).not.toContain(keyFragment);
      expect(fileData).not.toContain('secret'); // Original content

      // Should not contain sensitive key-related terms
      expect(fileData.toLowerCase()).not.toContain('key');
      expect(fileData.toLowerCase()).not.toContain('password');
    });

    it('should maintain anonymity throughout the flow', async () => {
      // Arrange & Act: Complete upload/download flow
      const testFile = new File(['anonymous test'], 'test.txt');

      const uploadResult = await uploadAnonymousUseCase.execute({
        file: testFile
      });

      await downloadFileUseCase.execute({
        fileId: uploadResult.fileId
      });

      // Assert: No user identification in storage
      const storageContents = fileRepository.getStorageContents();
      const storedFile = storageContents.get(uploadResult.fileId);
      const fileData = JSON.stringify(storedFile);

      // Should not contain any identifying information
      expect(fileData).not.toContain('user');
      expect(fileData).not.toContain('email');
      expect(fileData).not.toContain('ip');
      expect(fileData).not.toContain('session');
      expect(fileData).not.toContain('identifier');
    });

    it('should handle encryption errors gracefully without data leaks', async () => {
      // Arrange: Create use case with failing encryption service
      const failingEncryptionService = {
        ...encryptionService,
        encrypt: () => Promise.reject(new Error('Encryption failed'))
      };

      const failingUploadUseCase = new UploadAnonymousUseCase(
        fileRepository as any,
        new EncryptFileUseCase(failingEncryptionService as any),
        auditService as any
      );

      const testFile = new File(['sensitive data'], 'sensitive.txt');

      // Act & Assert: Should fail without exposing sensitive data
      await expect(failingUploadUseCase.execute({
        file: testFile
      })).rejects.toThrow();

      // Verify no data leaked to repository
      expect(fileRepository.getStorageSize()).toBe(0);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle reasonably sized files efficiently', async () => {
      // Arrange: Create test file (100KB)
      const mediumContent = 'A'.repeat(100 * 1024); // 100KB of 'A's
      const mediumFile = new File([mediumContent], 'medium.txt');

      // Act: Upload and download
      const start = Date.now();

      const uploadResult = await uploadAnonymousUseCase.execute({
        file: mediumFile
      });

      const downloadResult = await downloadFileUseCase.execute({
        fileId: uploadResult.fileId
      });

      const end = Date.now();

      // Assert: Reasonable performance (should complete within 2 seconds)
      expect(end - start).toBeLessThan(2000);

      // Verify content size matches
      expect(downloadResult.size).toBeGreaterThan(100 * 1024);
    });

    it('should clean up failed operations', async () => {
      // Arrange: Initial state
      const initialSize = fileRepository.getStorageSize();

      // Act: Failed upload (invalid file)
      const invalidFile = null as any;

      try {
        await uploadAnonymousUseCase.execute({
          file: invalidFile
        });
      } catch (error) {
        // Expected to fail
      }

      // Assert: No orphaned data
      expect(fileRepository.getStorageSize()).toBe(initialSize);
    });
  });
});
