/**
 * 🧪 EncryptedFile Entity Tests
 * 
 * Tests for zero-knowledge encrypted file management.
 * Validates privacy patterns and encryption/decryption workflows.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptedFile } from '../domain/entities/encrypted-file.entity';
import { EncryptionKey } from '../domain/value-objects/EncryptionKey';

describe('EncryptedFile Entity', () => {
  let testKey: EncryptionKey;
  let testFile: File;

  beforeEach(() => {
    testKey = EncryptionKey.generate();
    testFile = new File(['Hello, secure world!'], 'test.txt', { type: 'text/plain' });
  });

  afterEach(() => {
    testKey?.dispose();
  });

  describe('File Encryption (Client-Side)', () => {
    it('should encrypt a file and generate metadata', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);

      expect(encryptedFile.id).toBeTruthy();
      expect(encryptedFile.encryptedSize).toBeGreaterThan(0);
      expect(encryptedFile.originalSize).toBe(testFile.size);
      expect(encryptedFile.algorithm).toBe('AES-256-GCM');
      expect(encryptedFile.iv).toBeInstanceOf(Uint8Array);
      expect(encryptedFile.iv.length).toBe(12); // 96-bit IV for GCM
    });

    it('should generate different encrypted data for same file with different keys', async () => {
      const key1 = EncryptionKey.generate();
      const key2 = EncryptionKey.generate();
      const encrypted1 = await EncryptedFile.createFromFile(testFile, key1);
      const encrypted2 = await EncryptedFile.createFromFile(testFile, key2);

      expect(encrypted1.encryptedBlob).not.toStrictEqual(encrypted2.encryptedBlob);
      expect(encrypted1.iv).not.toStrictEqual(encrypted2.iv);

      key1.dispose();
      key2.dispose();
    });

    it('should generate different IVs for same file with same key', async () => {
      const encrypted1 = await EncryptedFile.createFromFile(testFile, testKey);
      const encrypted2 = await EncryptedFile.createFromFile(testFile, testKey);

      expect(encrypted1.iv).not.toStrictEqual(encrypted2.iv);
      expect(encrypted1.encryptedBlob).not.toStrictEqual(encrypted2.encryptedBlob);
    });
  });
  describe('File Decryption (Client-Side)', () => {
    it('should decrypt file back to original content', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);
      const decryptedFile = await encryptedFile.decrypt(testKey);

      expect(decryptedFile.name).toBe('test.txt');
      expect(decryptedFile.type).toBe('text/plain');
      expect(decryptedFile.size).toBe(testFile.size);

      const originalText = await testFile.text();
      const decryptedText = await decryptedFile.text();
      expect(decryptedText).toBe(originalText);
    });

    it('should fail decryption with wrong key', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);
      const wrongKey = EncryptionKey.generate();

      await expect(encryptedFile.decrypt(wrongKey)).rejects.toThrow();

      wrongKey.dispose();
    });

    it('should maintain file metadata through encryption/decryption cycle', async () => {
      const largeContent = 'A'.repeat(1000);
      const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });

      const encryptedFile = await EncryptedFile.createFromFile(largeFile, testKey);
      const decryptedFile = await encryptedFile.decrypt(testKey);

      expect(decryptedFile.size).toBe(largeFile.size);
      expect(await decryptedFile.text()).toBe(largeContent);
    });
  });

  describe('Server-Safe Operations', () => {
    it('should provide only server-safe metadata', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);

      // These are safe to store on server
      expect(encryptedFile.id).toBeTruthy();
      expect(encryptedFile.encryptedSize).toBeGreaterThan(0);
      expect(encryptedFile.algorithm).toBe('AES-256-GCM');
      expect(encryptedFile.iv).toBeInstanceOf(Uint8Array);
      expect(encryptedFile.timestamp).toBeInstanceOf(Date);

      // Original file details should not be exposed in server context
      expect(encryptedFile.originalSize).toBe(testFile.size); // Client knows this
    });

    it('should provide encrypted blob for server storage', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);
      const blob = encryptedFile.encryptedBlob;

      expect(blob).toBeInstanceOf(Uint8Array);
      expect(blob.length).toBeGreaterThan(0);
      expect(blob.length).toBeGreaterThan(testFile.size); // Includes auth tag
    });

    it('should create from server data (for download)', () => {
      const mockServerData = {
        id: 'test-id',
        encryptedBlob: new Uint8Array([1, 2, 3, 4, 5]),
        iv: new Uint8Array(12),
        metadata: {
          originalSize: 100,
          encryptedSize: 105,
          algorithm: 'AES-256-GCM' as const,
          timestamp: new Date()
        }
      };

      const encryptedFile = EncryptedFile.create(
        mockServerData.id,
        mockServerData.encryptedBlob,
        mockServerData.iv,
        mockServerData.metadata
      );
      expect(encryptedFile.id).toBe(mockServerData.id);
      expect(encryptedFile.encryptedBlob).toStrictEqual(mockServerData.encryptedBlob);
    });
  });
  describe('Privacy Protection', () => {
    it('should not expose original filename in server context', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);

      // Client knows the filename
      expect(encryptedFile.clientMetadata.filename).toBe('test.txt');

      // But server storage should not include this sensitive data
      const serverSafeData = encryptedFile.serverMetadata;
      expect(serverSafeData).not.toHaveProperty('filename');
      expect(serverSafeData).not.toHaveProperty('mimeType');
    }); it('should prevent direct access to decryption capabilities without key', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);

      // Should not be able to decrypt without providing the key (async)
      await expect((encryptedFile as any).decrypt()).rejects.toThrow('PRIVACY VIOLATION: Encryption key is required for decryption');
      expect(() => (encryptedFile as any).getPlaintext()).toThrow('PRIVACY VIOLATION: Cannot access plaintext without encryption key');
    }); it('should not log sensitive data in toString()', async () => {
      const encryptedFile = await EncryptedFile.createFromFile(testFile, testKey);
      const stringValue = encryptedFile.toString();

      expect(stringValue).toContain('[EncryptedFile ID:');
      expect(stringValue).toContain(encryptedFile.id);
      expect(stringValue).not.toContain('test.txt'); // filename
      expect(stringValue).not.toContain('Hello, secure world!'); // content
    });
  });

  describe('Input Validation', () => {
    it('should reject empty files', async () => {
      const emptyFile = new File([], 'empty.txt');

      await expect(EncryptedFile.createFromFile(emptyFile, testKey)).rejects.toThrow('Cannot encrypt empty file');
    }); it('should reject files that are too large', async () => {
      // Create a small file that would trigger size validation
      const maxFileSize = 100 * 1024 * 1024; // 100MB
      const mockLargeFile = {
        size: maxFileSize + 1,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        name: 'large.txt',
        type: 'text/plain'
      } as File;

      await expect(EncryptedFile.createFromFile(mockLargeFile, testKey)).rejects.toThrow('File too large');
    }, 1000); // 1 second timeout

    it('should reject invalid IV length', () => {
      const invalidIv = new Uint8Array(8); // Should be 12 bytes for GCM

      expect(() => EncryptedFile.create(
        'test-id',
        new Uint8Array(16),
        invalidIv,
        {
          originalSize: 10,
          encryptedSize: 16,
          algorithm: 'AES-256-GCM',
          timestamp: new Date()
        }
      )).toThrow('IV must be exactly 12 bytes for AES-GCM');
    });
  });

  describe('Binary File Support', () => {
    it('should handle binary files correctly', async () => {
      // Create a binary file with various byte values
      const binaryData = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        binaryData[i] = i;
      }

      const binaryFile = new File([binaryData], 'binary.bin', { type: 'application/octet-stream' });
      const encryptedFile = await EncryptedFile.createFromFile(binaryFile, testKey);
      const decryptedFile = await encryptedFile.decrypt(testKey);
      const decryptedData = new Uint8Array(await decryptedFile.arrayBuffer());
      expect(decryptedData).toStrictEqual(binaryData);
    });

    it('should handle various MIME types', async () => {
      const testCases = [
        { content: '{"test": "json"}', name: 'data.json', type: 'application/json' },
        { content: '<html><body>Test</body></html>', name: 'page.html', type: 'text/html' },
        { content: 'console.log("test");', name: 'script.js', type: 'application/javascript' }
      ];

      for (const testCase of testCases) {
        const file = new File([testCase.content], testCase.name, { type: testCase.type });
        const encryptedFile = await EncryptedFile.createFromFile(file, testKey);
        const decryptedFile = await encryptedFile.decrypt(testKey);

        expect(decryptedFile.type).toBe(testCase.type);
        expect(await decryptedFile.text()).toBe(testCase.content);
      }
    });
  });
});
