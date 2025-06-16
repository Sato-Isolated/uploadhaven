/**
 * File Decryption Utilities for API Routes
 *
 * Provides utility functions for decrypting files in API routes
 * when serving files for preview or download.
 * Now includes performance-optimized decryption for large files.
 */

import { readFile } from 'fs/promises';
import { decryptFile } from './encryption';
import { PerformanceDecryption, PERFORMANCE_CONFIG } from './performance-encryption';
import { getDefaultEncryptionPassword } from './encryption-config';
import type { IFile } from '@/lib/database/models';

/**
 * Reads and decrypts a file if it's encrypted
 * Uses performance-optimized decryption for large files
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
  const fileSizeOnDisk = fileBuffer.length;
  console.log(`   File size on disk: ${fileSizeOnDisk} bytes`);

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

    // Choose decryption method based on file size
    const usePerformanceDecryption = fileSizeOnDisk >= PERFORMANCE_CONFIG.STREAM_THRESHOLD;
    
    let decryptedBuffer: Buffer;
    
    if (usePerformanceDecryption) {
      console.log('   🚀 Using performance-optimized decryption for large file...');
      
      // Use performance-optimized decryption for large files
      decryptedBuffer = await PerformanceDecryption.decryptFileOptimized(
        fileBuffer,
        encryptionPassword,
        fileDoc.encryptionMetadata
      );
    } else {
      console.log('   📄 Using standard decryption for small file...');
      
      // Use standard decryption for smaller files
      decryptedBuffer = await decryptFile(
        fileBuffer,
        encryptionPassword,
        fileDoc.encryptionMetadata
      );
    }

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
