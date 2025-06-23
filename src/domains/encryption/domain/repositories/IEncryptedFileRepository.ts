import { Repository } from '../../../../shared/domain/types';
import { EncryptedFile } from '../entities/EncryptedFile';

/**
 * Repository interface for EncryptedFile entities
 * 
 * PRIVACY GUARANTEES:
 * - Repository only deals with encrypted data and public metadata
 * - No access to decryption keys or plaintext content
 * - All operations are safe for server-side implementation
 */
export interface IEncryptedFileRepository extends Repository<EncryptedFile> {
  /**
   * Store an encrypted file
   * Only encrypted blob and public metadata are stored
   */
  save(encryptedFile: EncryptedFile): Promise<void>;

  /**
   * Find encrypted file by ID
   * Returns null if not found or expired
   */
  findById(id: string): Promise<EncryptedFile | null>;

  /**
   * Find encrypted file by ID including expired files
   * Used for administrative purposes
   */
  findByIdIncludeExpired(id: string): Promise<EncryptedFile | null>;

  /**
   * Delete encrypted file by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Update download count for a file
   * Returns updated entity
   */
  incrementDownloadCount(id: string): Promise<EncryptedFile | null>;

  /**
   * Find all expired files for cleanup
   */
  findExpiredFiles(): Promise<EncryptedFile[]>;

  /**
   * Delete all expired files
   * Returns count of deleted files
   */
  deleteExpiredFiles(): Promise<number>;

  /**
   * Find files uploaded before a certain date
   * Used for data retention policies
   */
  findFilesOlderThan(date: Date): Promise<EncryptedFile[]>;

  /**
   * Get total storage usage (in bytes)
   * Privacy-safe aggregate metric
   */
  getTotalStorageUsed(): Promise<number>;

  /**
   * Get file count statistics
   * Privacy-safe aggregate metrics
   */
  getFileStatistics(): Promise<{
    totalFiles: number;
    activeFiles: number;
    expiredFiles: number;
    totalSizeBytes: number;
  }>;
}
