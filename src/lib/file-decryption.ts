/**
 * File Decryption Utilities for API Routes
 *
 * Provides utility functions for decrypting files in API routes
 * when serving files for preview or download.
 */

import { readFile } from 'fs/promises';
import { decryptFile } from '@/lib/encryption';
import { getDefaultEncryptionPassword } from '@/lib/encryption-config';
import type { IFile } from '@/lib/models';

/**
 * Reads and decrypts a file if it's encrypted
 */
export async function readAndDecryptFile(
  filePath: string,
  fileDoc: IFile
): Promise<Buffer> {
  console.log('🔧 readAndDecryptFile called:');
  console.log(`   File path: ${filePath}`);
  console.log(`   Is encrypted: ${fileDoc.isEncrypted}`);
  console.log(`   Has metadata: ${!!fileDoc.encryptionMetadata}`);

  // Read the file from disk
  const fileBuffer = await readFile(filePath);
  console.log(`   File size on disk: ${fileBuffer.length} bytes`);

  // If file is not encrypted, return as-is
  if (!fileDoc.isEncrypted || !fileDoc.encryptionMetadata) {
    console.log('   → File not encrypted, returning as-is');
    return fileBuffer;
  }

  // File is encrypted, decrypt it
  try {
    console.log('   → File is encrypted, attempting decryption...');
    const encryptionPassword = getDefaultEncryptionPassword();

    if (!encryptionPassword) {
      console.error('   ❌ No encryption password available');
      throw new Error('No encryption password available for decryption');
    }

    console.log('   → Encryption password available, decrypting...');
    console.log(
      `   → Metadata: ${JSON.stringify(fileDoc.encryptionMetadata, null, 2)}`
    );

    // Decrypt the file using the encryption metadata
    const decryptedBuffer = await decryptFile(
      fileBuffer,
      encryptionPassword,
      fileDoc.encryptionMetadata
    );

    console.log(
      `   ✅ Decryption successful! Size: ${decryptedBuffer.length} bytes`
    );
    console.log(
      `   → Content preview: ${decryptedBuffer.toString('utf8', 0, 50).replace(/\n/g, '\\n')}`
    );
    return decryptedBuffer;
  } catch (decryptionError) {
    console.error('   ❌ File decryption failed:', decryptionError);
    throw new Error('Failed to decrypt file - file may be corrupted');
  }
}

/**
 * Gets the appropriate content length for a file response
 * For encrypted files, returns the original file size (before encryption)
 * For unencrypted files, returns the actual file size
 */
export function getContentLength(fileDoc: IFile): number {
  if (fileDoc.isEncrypted && fileDoc.encryptionMetadata?.encryptedSize) {
    // Return original size for encrypted files
    return fileDoc.size;
  }

  // Return actual size for unencrypted files
  return fileDoc.size;
}

/**
 * Logs decryption activity for security monitoring
 */
export function logDecryptionActivity(
  fileDoc: IFile,
  activityType: 'preview' | 'download',
  clientIP: string,
  userAgent: string
): void {
  if (fileDoc.isEncrypted) {
    console.log(`🔓 File decryption for ${activityType}:`, {
      file: fileDoc.originalName,
      algorithm: fileDoc.encryptionMetadata?.algorithm,
      clientIP,
      userAgent: userAgent.substring(0, 100), // Truncate for logs
      timestamp: new Date().toISOString(),
    });
  }
}
