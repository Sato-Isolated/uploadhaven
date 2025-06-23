/**
 * MongoDB File Repository - Concrete implementation of IFileRepository
 * 
 * Implements file persistence using MongoDB with zero-knowledge guarantees.
 * Maps between domain entities and database documents while preserving privacy.
 * 
 * @domain file-sharing
 * @pattern Repository Implementation (DDD)
 * @privacy zero-knowledge - no sensitive data in storage operations
 */

import { IFileRepository, FileStorageStats, StorageIntegrityReport, RepositoryHealth } from '../../application/interfaces/file.repository.interface';
import { SharedFile } from '../../domain/entities/shared-file.entity';
import { FileId } from '../../domain/value-objects/file-id.vo';
import { EncryptedFile } from '../../../encryption/domain/entities/encrypted-file.entity';
import { SharedFileModel, ISharedFileDocument } from './shared-file.model';
import { getDatabase } from './connection';

/**
 * MongoDB implementation of the file repository
 * 
 * Responsibilities:
 * - Entity-to-document mapping with privacy preservation
 * - Database operations with error handling
 * - Query optimization for performance
 * - TTL and cleanup management
 */
export class MongoFileRepository implements IFileRepository {
  constructor() {
    // Ensure database connection is available
    this.ensureConnection();
  }

  // =============================================================================
  // Core CRUD Operations
  // =============================================================================

  /**
   * Store a shared file entity
   */
  async store(sharedFile: SharedFile): Promise<void> {
    try {
      await this.ensureConnection();

      // Map domain entity to database document
      const document = this.mapEntityToDocument(sharedFile);

      // Create new document
      const fileDoc = new SharedFileModel(document);
      await fileDoc.save();

    } catch (error) {
      // Privacy-safe error handling
      if (error instanceof Error) {
        // Check for duplicate key error (file ID collision)
        if (error.message.includes('duplicate key') || error.message.includes('11000')) {
          throw new Error(`File with ID ${sharedFile.id} already exists`);
        }
        throw new Error(`Failed to store file: ${error.message}`);
      }
      throw new Error('Failed to store file: Unknown error');
    }
  }

  /**
   * Find a shared file by ID
   */
  async findById(fileId: FileId): Promise<SharedFile | null> {
    try {
      await this.ensureConnection();

      // Use static method for optimized query
      const document = await SharedFileModel.findAvailableById(fileId.value);

      if (!document) {
        return null;
      }

      // Map document to domain entity
      return this.mapDocumentToEntity(document);

    } catch (error) {
      // Privacy-safe error handling
      throw new Error(`Failed to find file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing shared file
   */
  async update(sharedFile: SharedFile): Promise<void> {
    try {
      await this.ensureConnection();

      // Map entity to update data
      const updateData = this.mapEntityToDocument(sharedFile);

      // Update document
      const result = await SharedFileModel.updateOne(
        { fileId: sharedFile.id },
        { $set: updateData },
        { runValidators: true }
      );

      if (result.matchedCount === 0) {
        throw new Error(`File with ID ${sharedFile.id} not found`);
      }

    } catch (error) {
      throw new Error(`Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Hard delete a file from storage
   */
  async delete(fileId: FileId): Promise<void> {
    try {
      await this.ensureConnection();

      const result = await SharedFileModel.deleteOne({ fileId: fileId.value });

      if (result.deletedCount === 0) {
        throw new Error(`File with ID ${fileId.value} not found`);
      }

    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // Query Operations
  // =============================================================================

  /**
   * Check if a file exists and is available
   */
  async exists(fileId: FileId): Promise<boolean> {
    try {
      await this.ensureConnection();

      const count = await SharedFileModel.countDocuments({
        fileId: fileId.value,
        isAvailable: true,
        expiresAt: { $gt: new Date() },
        $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
      });

      return count > 0;    } catch {
      // Return false on error to be safe
      return false;
    }
  }

  /**
   * Get file metadata without the encrypted blob
   */
  async getMetadata(fileId: FileId): Promise<{
    size: number;
    expiresAt: Date;
    remainingDownloads: number;
    isAvailable: boolean;
  } | null> {
    try {
      await this.ensureConnection();

      const document = await SharedFileModel.findOne(
        { fileId: fileId.value },
        {
          encryptedSize: 1,
          expiresAt: 1,
          maxDownloads: 1,
          downloadCount: 1,
          isAvailable: 1,
          _id: 0
        }
      );

      if (!document) {
        return null;
      } return {
        size: document.encryptedSize,
        expiresAt: document.expiresAt,
        remainingDownloads: Math.max(0, document.maxDownloads - document.downloadCount),
        isAvailable: document.isAvailable &&
          document.expiresAt > new Date() &&
          document.downloadCount < document.maxDownloads,
      };    } catch {
      return null;
    }
  }

  // =============================================================================
  // Bulk Operations
  // =============================================================================

  /**
   * Find expired files for cleanup
   */
  async findExpiredFiles(limit: number = 100): Promise<FileId[]> {
    try {
      await this.ensureConnection();

      const documents = await SharedFileModel.findExpiredFiles(limit);

      return documents.map(doc => FileId.fromString(doc.fileId));

    } catch (error) {
      // Return empty array on error
      return [];
    }
  }
  /**
   * Find files with exhausted download limits
   */
  async findExhaustedFiles(limit: number = 100): Promise<FileId[]> {
    try {
      await this.ensureConnection();

      const documents = await SharedFileModel.find({
        $expr: { $gte: ['$downloadCount', '$maxDownloads'] }
      }).limit(limit);

      return documents.map(doc => FileId.fromString(doc.fileId));

    } catch (error) {
      return [];
    }
  }

  /**
   * Bulk delete multiple files
   */
  async bulkDelete(fileIds: FileId[]): Promise<number> {
    try {
      await this.ensureConnection();

      const fileIdStrings = fileIds.map(id => id.value);
      const result = await SharedFileModel.deleteMany({
        fileId: { $in: fileIdStrings }
      });

      return result.deletedCount || 0;

    } catch (error) {
      return 0;
    }
  }

  // =============================================================================
  // Statistics & Monitoring
  // =============================================================================

  /**
   * Get total number of active files
   */
  async getActiveFileCount(): Promise<number> {
    try {
      await this.ensureConnection();

      return await SharedFileModel.countDocuments({
        isAvailable: true,
        expiresAt: { $gt: new Date() },
        $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
      });

    } catch (error) {
      return 0;
    }
  }

  /**
   * Get total storage used by active files
   */
  async getTotalStorageUsed(): Promise<number> {
    try {
      await this.ensureConnection();

      const result = await SharedFileModel.aggregate([
        {
          $match: {
            isAvailable: true,
            expiresAt: { $gt: new Date() }
          }
        },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$encryptedSize' }
          }
        }
      ]);

      return result.length > 0 ? result[0].totalSize : 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Get privacy-safe storage statistics
   */
  async getStorageStats(): Promise<FileStorageStats> {
    try {
      await this.ensureConnection();

      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const stats = await SharedFileModel.aggregate([
        {
          $facet: {
            active: [
              {
                $match: {
                  isAvailable: true,
                  expiresAt: { $gt: now },
                  $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$encryptedSize' },
                  avgSize: { $avg: '$encryptedSize' },
                  oldestUpload: { $min: '$uploadedAt' }
                }
              }
            ],
            expiringSoon: [
              {
                $match: {
                  isAvailable: true,
                  expiresAt: { $gt: now, $lt: in24Hours }
                }
              },
              { $count: 'count' }
            ],
            nearLimit: [
              {
                $match: {
                  isAvailable: true,
                  expiresAt: { $gt: now },
                  $expr: {
                    $and: [
                      { $gt: ['$maxDownloads', 0] },
                      { $gte: ['$downloadCount', { $multiply: ['$maxDownloads', 0.8] }] }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]);

      const result = stats[0];
      const activeStats = result.active[0] || { count: 0, totalSize: 0, avgSize: 0, oldestUpload: now };
      const expiringSoon = result.expiringSoon[0]?.count || 0;
      const nearLimit = result.nearLimit[0]?.count || 0;

      const oldestFileAge = activeStats.oldestUpload ?
        Math.floor((now.getTime() - activeStats.oldestUpload.getTime()) / (1000 * 60 * 60)) : 0;

      return {
        activeFiles: activeStats.count,
        totalSizeBytes: activeStats.totalSize,
        averageFileSizeBytes: Math.round(activeStats.avgSize || 0),
        oldestFileAge,
        filesExpiringSoon: expiringSoon,
        filesNearDownloadLimit: nearLimit,
      };

    } catch (error) {
      return {
        activeFiles: 0,
        totalSizeBytes: 0,
        averageFileSizeBytes: 0,
        oldestFileAge: 0,
        filesExpiringSoon: 0,
        filesNearDownloadLimit: 0,
      };
    }
  }

  // =============================================================================
  // Maintenance Operations
  // =============================================================================

  /**
   * Cleanup expired and exhausted files
   */
  async cleanup(): Promise<{ expired: number; exhausted: number }> {
    try {
      await this.ensureConnection();

      const expiredResult = await SharedFileModel.deleteMany({
        expiresAt: { $lte: new Date() }
      });

      const exhaustedResult = await SharedFileModel.deleteMany({
        $expr: { $gte: ['$downloadCount', '$maxDownloads'] }
      });

      return {
        expired: expiredResult.deletedCount || 0,
        exhausted: exhaustedResult.deletedCount || 0,
      };

    } catch (error) {
      return { expired: 0, exhausted: 0 };
    }
  }

  /**
   * Verify storage integrity
   */
  async verifyIntegrity(): Promise<StorageIntegrityReport> {
    const checkedAt = new Date();
    const issues: string[] = [];

    try {
      await this.ensureConnection();

      // Count total files
      const totalFiles = await SharedFileModel.countDocuments();

      // Check for files with invalid data
      const invalidFiles = await SharedFileModel.countDocuments({
        $or: [
          { fileId: { $exists: false } },
          { encryptedBlob: { $exists: false } },
          { iv: { $exists: false } },
          { encryptedSize: { $lte: 0 } },
          { maxDownloads: { $lte: 0 } },
          { downloadCount: { $lt: 0 } }
        ]
      });

      if (invalidFiles > 0) {
        issues.push(`Found ${invalidFiles} files with invalid metadata`);
      }

      // Check for inconsistent download counts
      const inconsistentDownloads = await SharedFileModel.countDocuments({
        $expr: { $gt: ['$downloadCount', '$maxDownloads'] }
      });

      if (inconsistentDownloads > 0) {
        issues.push(`Found ${inconsistentDownloads} files with download count exceeding limit`);
      }

      return {
        isHealthy: issues.length === 0,
        totalFiles,
        corruptedFiles: invalidFiles,
        orphanedFiles: 0, // MongoDB doesn't have orphaned files in the same way
        inconsistentMetadata: inconsistentDownloads,
        issues,
        checkedAt,
      };

    } catch (error) {
      issues.push(`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isHealthy: false,
        totalFiles: 0,
        corruptedFiles: 0,
        orphanedFiles: 0,
        inconsistentMetadata: 0,
        issues,
        checkedAt,
      };
    }
  }

  /**
   * Get repository health status
   */
  async getHealth(): Promise<RepositoryHealth> {
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      await this.ensureConnection();

      // Test basic operation
      await SharedFileModel.countDocuments().limit(1);
      const responseTimeMs = Date.now() - startTime;

      const db = getDatabase();
      const isConnected = db.isConnected();

      return {
        isOperational: isConnected,
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        responseTimeMs,
        errorRate: 0, // TODO: Implement error rate tracking
        lastSuccessfulOperation: new Date(),
        issues,
      };

    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        isOperational: false,
        connectionStatus: 'disconnected',
        responseTimeMs,
        errorRate: 100,
        lastSuccessfulOperation: new Date(0), // Unix epoch
        issues,
      };
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Ensure database connection is established
   */
  private async ensureConnection(): Promise<void> {
    const db = getDatabase();
    await db.connect();
  }
  /**
   * Map domain entity to database document
   */
  private mapEntityToDocument(sharedFile: SharedFile): Partial<ISharedFileDocument> {
    const storageData = sharedFile.toStorageData();

    return {
      fileId: storageData.id,
      encryptedBlob: Buffer.from(storageData.encryptedBlob),
      iv: storageData.iv,
      encryptedSize: storageData.size,
      uploadedAt: storageData.createdAt,
      expiresAt: storageData.expiresAt,
      maxDownloads: storageData.maxDownloads,
      downloadCount: storageData.downloadCount,
      isAvailable: !storageData.isDeleted,
    };
  }
  /**
   * Map database document to domain entity
   */
  private mapDocumentToEntity(document: ISharedFileDocument): SharedFile {
    // Create a minimal EncryptedFile for reconstruction
    // This is a simplified approach - in a real scenario, we might need more sophisticated reconstruction
    const encryptedFile = EncryptedFile.fromStoredData(
      document.fileId,          // Pass the ID
      new Uint8Array(document.encryptedBlob),
      document.iv,
      document.encryptedSize
    );

    return SharedFile.fromStoredData(
      document.fileId,
      encryptedFile,
      document.encryptedSize,
      document.uploadedAt,
      document.expiresAt,
      document.maxDownloads,
      document.downloadCount,
      !document.isAvailable
    );
  }
}

/**
 * Default repository instance for dependency injection
 */
export const createFileRepository = (): IFileRepository => {
  return new MongoFileRepository();
};
