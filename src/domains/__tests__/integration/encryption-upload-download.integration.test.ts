/**
 * 🧪 Integration Test: Encryption + Upload/Download Flow
 * 
 * Tests the complete end-to-end flow that was previously failing
 * with the IV mismatch bug. Now should work correctly.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../../encryption/infrastructure/crypto/encryption.service';
import { EncryptionKey } from '../../encryption/domain/value-objects/EncryptionKey';
import { EncryptedFile } from '../../encryption/domain/entities/encrypted-file.entity';
import { SharedFile } from '../../file-sharing/domain/entities/shared-file.entity';

describe('Encryption + Upload/Download Integration', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  describe('End-to-End File Flow (Bug Fix Verification)', () => {
    test('should upload, store, retrieve, and decrypt file successfully', async () => {
      // 1. Create test file
      const originalContent = 'This is a test file for the encryption flow';
      const testFile = new File([originalContent], 'test.txt', { type: 'text/plain' });
      
      // 2. Generate encryption key
      const encryptionKey = EncryptionKey.generate();
      
      // 3. Encrypt file (this previously had the IV bug)
      const encryptedFile = await EncryptedFile.createFromFile(testFile, encryptionKey);
      
      // 4. Verify encrypted file properties
      const clientMetadata = encryptedFile.clientMetadata;
      expect(clientMetadata.filename).toBe('test.txt');
      expect(clientMetadata.mimeType).toBe('text/plain');
      expect(clientMetadata.originalSize).toBe(originalContent.length);
      expect(encryptedFile.encryptedSize).toBeGreaterThan(0);
      
      // 5. Create SharedFile (simulates upload to server)
      const sharedFile = await SharedFile.createAnonymous(encryptedFile, 24, 10);
        // 6. Simulate server-side serialization (what gets stored in DB)
      const serverData = {
        id: sharedFile.id,
        encryptedBlob: Array.from(sharedFile.encryptedBlob), // Convert to array for JSON
        iv: sharedFile.iv, // Already base64 string
        size: sharedFile.size,
        // Only server-safe metadata
        createdAt: sharedFile.createdAt,
        expiresAt: sharedFile.expiresAt,
        maxDownloads: sharedFile.maxDownloads,
        downloadCount: sharedFile.downloadCount
      };
      
      // 7. Simulate server-side deserialization (retrieval from DB)
      const retrievedEncryptedFile = EncryptedFile.fromStoredData(
        serverData.id,
        new Uint8Array(serverData.encryptedBlob),
        serverData.iv,
        serverData.size
      );
      
      // 8. Decrypt file (this previously failed with "operation-specific reason")
      const decryptedFile = await retrievedEncryptedFile.decrypt(encryptionKey);
        // 9. Verify decrypted content
      const decryptedContent = await decryptedFile.text();
      expect(decryptedContent).toBe(originalContent);
      
      // Note: filename/type may not be preserved when reconstructing from storage
      // This is expected behavior for privacy - only encrypted blob is stored
      expect(decryptedFile.size).toBe(originalContent.length);
    });

    test('should handle binary files correctly', async () => {
      // Create a binary file (simulated image data)
      const binaryData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53
      ]);
      
      const binaryFile = new File([binaryData], 'test.png', { type: 'image/png' });
      const encryptionKey = EncryptionKey.generate();
      
      // Encrypt
      const encryptedFile = await EncryptedFile.createFromFile(binaryFile, encryptionKey);
      
      // Simulate server round-trip
      const sharedFile = await SharedFile.createAnonymous(encryptedFile, 1, 1);
        // Simulate server storage/retrieval
      const retrievedEncryptedFile = EncryptedFile.fromStoredData(
        sharedFile.id,
        sharedFile.encryptedBlob,
        sharedFile.iv,
        sharedFile.size
      );
      
      // Decrypt
      const decryptedFile = await retrievedEncryptedFile.decrypt(encryptionKey);
        // Verify binary data integrity
      const decryptedBuffer = await decryptedFile.arrayBuffer();
      const decryptedData = new Uint8Array(decryptedBuffer);
      
      expect(decryptedData).toEqual(binaryData);
      expect(decryptedFile.size).toBe(binaryData.length);
    });

    test('should fail decryption with wrong key (security verification)', async () => {
      const testFile = new File(['secret content'], 'secret.txt', { type: 'text/plain' });
      const correctKey = EncryptionKey.generate();
      const wrongKey = EncryptionKey.generate();
      
      // Encrypt with correct key
      const encryptedFile = await EncryptedFile.createFromFile(testFile, correctKey);
      
      // Try to decrypt with wrong key
      await expect(
        encryptedFile.decrypt(wrongKey)
      ).rejects.toThrow();
    });
  });

  describe('Encryption Service Integration', () => {
    test('should use encryption service for file operations', async () => {
      const testFile = new File(['service test'], 'service.txt', { type: 'text/plain' });
      const encryptionKey = encryptionService.generateKey();
      
      // Test encryption service methods
      const encryptResult = await encryptionService.encryptFile(testFile, encryptionKey);
      
      expect(encryptResult.encryptedData).toBeInstanceOf(Uint8Array);
      expect(encryptResult.encryptedData.length).toBeGreaterThan(0);
      expect(encryptResult.iv).toBeTruthy();
      expect(encryptResult.originalMetadata.filename).toBe('service.txt');
      expect(encryptResult.originalMetadata.mimeType).toBe('text/plain');
      expect(encryptResult.originalMetadata.size).toBe(12); // 'service test' length
      
      // Test decryption
      const decryptResult = await encryptionService.decryptFile(
        encryptResult.encryptedData,
        encryptionKey,
        encryptResult.iv
      );
      
      expect(decryptResult.fileData).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(decryptResult.fileData)).toBe('service test');
    });
  });

  describe('Key Management Integration', () => {
    test('should derive consistent keys from passwords', async () => {
      const password = 'test-password-123';
      const salt = new Uint8Array(16).fill(1); // Fixed salt for consistency
      
      // Derive key twice with same password and salt
      const result1 = await encryptionService.deriveKeyFromPassword(password, salt);
      const result2 = await encryptionService.deriveKeyFromPassword(password, salt);
      
      // Keys should be identical
      expect(result1.key.toBase64()).toBe(result2.key.toBase64());
      expect(result1.salt).toEqual(result2.salt);
      
      // Test encryption/decryption with derived key
      const testFile = new File(['password test'], 'pwd.txt', { type: 'text/plain' });
      const encryptedFile = await EncryptedFile.createFromFile(testFile, result1.key);
      const decryptedFile = await encryptedFile.decrypt(result2.key);
      
      const decryptedContent = await decryptedFile.text();
      expect(decryptedContent).toBe('password test');
    });
  });

  describe('Zero-Knowledge Privacy Verification', () => {
    test('should never expose keys in server-side data', async () => {
      const testFile = new File(['private content'], 'private.txt', { type: 'text/plain' });
      const encryptionKey = EncryptionKey.generate();
      
      const encryptedFile = await EncryptedFile.createFromFile(testFile, encryptionKey);
      const sharedFile = await SharedFile.createAnonymous(encryptedFile, 12, 5);
        // Get server-side metadata (what would be stored in database)
      const serverMetadata = encryptedFile.serverMetadata;
      const serverData = {
        ...serverMetadata,
        encryptedBlob: Array.from(sharedFile.encryptedBlob), // Convert to array for JSON
        iv: sharedFile.iv // Already base64 string
      };
      
      const serverDataString = JSON.stringify(serverData);
      
      // Verify no key material in server data
      const keyBase64 = encryptionKey.toBase64();
      expect(serverDataString).not.toContain(keyBase64);
      
      // Verify only encrypted blob and IV are present
      expect(serverData.encryptedBlob).toBeTruthy();
      expect(serverData.iv).toBeTruthy();
      expect(serverData.encryptedBlob).not.toBe(keyBase64);
      expect(serverData.iv).not.toBe(keyBase64);
        // Verify we can't decrypt without the key
      const reconstructedFile = EncryptedFile.fromStoredData(
        serverData.id,
        new Uint8Array(serverData.encryptedBlob),
        serverData.iv,
        serverData.encryptedSize
      );
      
      const wrongKey = EncryptionKey.generate();
      await expect(
        reconstructedFile.decrypt(wrongKey)
      ).rejects.toThrow();
    });
  });
});
