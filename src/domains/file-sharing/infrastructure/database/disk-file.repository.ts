/**
 * Disk File Repository - Local storage implementation of IFileRepository
 * 
 * Implements file persistence using local disk storage with zero-knowledge guarantees.
 * Files are stored as encrypted blobs on disk, with metadata in MongoDB.
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
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Disk storage configuration
 */
interface DiskStorageConfig {
  baseUploadDir: string;
  encryptedSubDir: string;
  tempSubDir: string;
  fileExtension: string;
  filePermissions: number;
}

/**
 * Disk-based implementation of the file repository
 * 
 * Responsibilities:
 * - Encrypted file storage on local disk
 * - Metadata storage in MongoDB
 * - TTL and cleanup management
 * - File integrity verification
 */
export class DiskFileRepository implements IFileRepository {
  private config: DiskStorageConfig;

  constructor(baseUploadDir?: string) {
    this.config = {
      baseUploadDir: baseUploadDir || './uploads',
      encryptedSubDir: 'encrypted',
      tempSubDir: 'temp',
      fileExtension: '.zkblob',
      filePermissions: 0o600, // Owner read/write only
    };

    // Ensure directories exist
    this.initializeDirectories();
  }

  // =============================================================================
  // Initialization
  // =============================================================================

  /**
   * Initialize storage directories
   */
  private async initializeDirectories(): Promise<void> {
    try {
      const encryptedDir = path.join(this.config.baseUploadDir, this.config.encryptedSubDir);
      const tempDir = path.join(this.config.baseUploadDir, this.config.tempSubDir);

      await fs.mkdir(encryptedDir, { recursive: true, mode: 0o700 });
      await fs.mkdir(tempDir, { recursive: true, mode: 0o700 });

      console.log('✅ Disk storage directories initialized');
    } catch (error) {
      console.error('❌ Failed to initialize storage directories:', error);
      throw error;
    }
  }

  // =============================================================================
  // Core CRUD Operations
  // =============================================================================

  /**
   * Store a shared file entity on disk + metadata in MongoDB
   */
  async store(sharedFile: SharedFile): Promise<void> {
    try {
      await this.ensureConnection();

      // 1. Generate file path
      const filePath = this.generateFilePath(sharedFile.id);
      
      // 2. Write encrypted blob to disk
      const storageData = sharedFile.toStorageData();
      await fs.writeFile(filePath, Buffer.from(storageData.encryptedBlob), { 
        mode: this.config.filePermissions 
      });

      // 3. Store metadata in MongoDB (without blob)
      const document = this.mapEntityToDocument(sharedFile, filePath);
      const fileDoc = new SharedFileModel(document);
      await fileDoc.save();

      console.log(`✅ File stored: ${sharedFile.id} → ${filePath}`);

    } catch (error) {
      // Cleanup on failure
      try {
        const filePath = this.generateFilePath(sharedFile.id);
        await fs.unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }

      // Privacy-safe error handling
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('11000')) {
          throw new Error(`File with ID ${sharedFile.id} already exists`);
        }
        throw new Error(`Failed to store file: ${error.message}`);
      }
      throw new Error('Failed to store file: Unknown error');
    }
  }

  /**
   * Find a shared file by ID (load from disk + MongoDB metadata)
   */
  async findById(fileId: FileId): Promise<SharedFile | null> {
    try {
      await this.ensureConnection();

      // 1. Get metadata from MongoDB
      const document = await SharedFileModel.findAvailableById(fileId.value);
      if (!document) {
        return null;
      }

      // 2. Read encrypted blob from disk
      const filePath = document.filePath || this.generateFilePath(fileId.value);
      
      try {
        const encryptedBlob = await fs.readFile(filePath);
        
        // 3. Create EncryptedFile for domain entity
        const encryptedFile = EncryptedFile.fromStoredData(
          document.fileId,
          new Uint8Array(encryptedBlob),
          document.iv,
          document.encryptedSize
        );

        // 4. Map to domain entity
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

      } catch (diskError) {
        // File exists in MongoDB but not on disk - mark as corrupted
        console.warn(`⚠️ File metadata exists but disk file missing: ${fileId.value}`);
        await SharedFileModel.updateOne(
          { fileId: fileId.value },
          { $set: { isAvailable: false } }
        );
        return null;
      }

    } catch (error) {
      throw new Error(`Failed to find file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing shared file
   */
  async update(sharedFile: SharedFile): Promise<void> {
    try {
      await this.ensureConnection();

      // Only update metadata in MongoDB (blob doesn't change)
      const updateData = this.mapEntityToUpdateDocument(sharedFile);

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
   * Hard delete a file from storage (disk + MongoDB)
   */
  async delete(fileId: FileId): Promise<void> {
    try {
      await this.ensureConnection();

      // 1. Get file path from MongoDB
      const document = await SharedFileModel.findOne({ fileId: fileId.value });
      if (!document) {
        throw new Error(`File with ID ${fileId.value} not found`);
      }

      // 2. Delete from disk
      const filePath = document.filePath || this.generateFilePath(fileId.value);
      try {
        await fs.unlink(filePath);
      } catch (diskError) {
        console.warn(`⚠️ Failed to delete disk file: ${filePath}`);
        // Continue with MongoDB deletion even if disk deletion fails
      }

      // 3. Delete metadata from MongoDB
      const result = await SharedFileModel.deleteOne({ fileId: fileId.value });
      if (result.deletedCount === 0) {
        console.warn(`⚠️ File metadata not found in MongoDB: ${fileId.value}`);
      }

      console.log(`✅ File deleted: ${fileId.value}`);

    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // Query Operations (Delegate to MongoDB for metadata)
  // =============================================================================

  async exists(fileId: FileId): Promise<boolean> {
    try {
      await this.ensureConnection();

      const count = await SharedFileModel.countDocuments({
        fileId: fileId.value,
        isAvailable: true,
        expiresAt: { $gt: new Date() },
        $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
      });

      return count > 0;
    } catch {
      return false;
    }
  }

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
      }

      return {
        size: document.encryptedSize,
        expiresAt: document.expiresAt,
        remainingDownloads: Math.max(0, document.maxDownloads - document.downloadCount),
        isAvailable: document.isAvailable &&
          document.expiresAt > new Date() &&
          document.downloadCount < document.maxDownloads,
      };
    } catch {
      return null;
    }
  }

  // =============================================================================
  // Bulk Operations & Cleanup
  // =============================================================================

  async findExpiredFiles(limit: number = 100): Promise<FileId[]> {
    try {
      await this.ensureConnection();
      const documents = await SharedFileModel.findExpiredFiles(limit);
      return documents.map(doc => FileId.fromString(doc.fileId));
    } catch {
      return [];
    }
  }

  async findExhaustedFiles(limit: number = 100): Promise<FileId[]> {
    try {
      await this.ensureConnection();

      const documents = await SharedFileModel.find({
        $expr: { $gte: ['$downloadCount', '$maxDownloads'] }
      }).limit(limit);

      return documents.map(doc => FileId.fromString(doc.fileId));
    } catch {
      return [];
    }
  }

  async bulkDelete(fileIds: FileId[]): Promise<number> {
    try {
      await this.ensureConnection();

      let deletedCount = 0;
      for (const fileId of fileIds) {
        try {
          await this.delete(fileId);
          deletedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to delete file ${fileId.value}:`, error);
          // Continue with next file
        }
      }

      return deletedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Enhanced cleanup that removes orphaned files
   */
  async cleanup(): Promise<{ expired: number; exhausted: number; orphaned: number }> {
    try {
      await this.ensureConnection();

      // 1. Standard MongoDB cleanup
      const expiredResult = await SharedFileModel.deleteMany({
        expiresAt: { $lte: new Date() }
      });

      const exhaustedResult = await SharedFileModel.deleteMany({
        $expr: { $gte: ['$downloadCount', '$maxDownloads'] }
      });

      // 2. Find and remove orphaned disk files
      const orphaned = await this.cleanupOrphanedFiles();

      return {
        expired: expiredResult.deletedCount || 0,
        exhausted: exhaustedResult.deletedCount || 0,
        orphaned,
      };

    } catch (error) {
      console.error('Cleanup failed:', error);
      return { expired: 0, exhausted: 0, orphaned: 0 };
    }
  }

  /**
   * Find and remove orphaned files (exist on disk but not in MongoDB)
   */
  private async cleanupOrphanedFiles(): Promise<number> {
    try {
      const encryptedDir = path.join(this.config.baseUploadDir, this.config.encryptedSubDir);
      const files = await fs.readdir(encryptedDir);
      
      let orphanedCount = 0;
      for (const file of files) {
        if (!file.endsWith(this.config.fileExtension)) {
          continue;
        }

        // Extract fileId from filename
        const fileId = file.replace(this.config.fileExtension, '');
        
        // Check if metadata exists in MongoDB
        const exists = await SharedFileModel.exists({ fileId });
        if (!exists) {
          // Orphaned file - delete it
          const filePath = path.join(encryptedDir, file);
          try {
            await fs.unlink(filePath);
            orphanedCount++;
            console.log(`🗑️ Removed orphaned file: ${file}`);
          } catch (deleteError) {
            console.warn(`⚠️ Failed to delete orphaned file ${file}:`, deleteError);
          }
        }
      }

      return orphanedCount;
    } catch (error) {
      console.error('Orphaned file cleanup failed:', error);
      return 0;
    }
  }

  // =============================================================================
  // Statistics & Monitoring (Delegate to MongoDB + Disk checks)
  // =============================================================================

  async getActiveFileCount(): Promise<number> {
    try {
      await this.ensureConnection();

      return await SharedFileModel.countDocuments({
        isAvailable: true,
        expiresAt: { $gt: new Date() },
        $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
      });
    } catch {
      return 0;
    }
  }

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
    } catch {
      return 0;
    }
  }

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

  async verifyIntegrity(): Promise<StorageIntegrityReport> {
    const checkedAt = new Date();
    const issues: string[] = [];

    try {
      await this.ensureConnection();

      // 1. MongoDB integrity checks
      const totalFiles = await SharedFileModel.countDocuments();

      const invalidFiles = await SharedFileModel.countDocuments({
        $or: [
          { fileId: { $exists: false } },
          { filePath: { $exists: false } },
          { iv: { $exists: false } },
          { encryptedSize: { $lte: 0 } },
          { maxDownloads: { $lte: 0 } },
          { downloadCount: { $lt: 0 } }
        ]
      });

      if (invalidFiles > 0) {
        issues.push(`Found ${invalidFiles} files with invalid metadata`);
      }

      // 2. Disk integrity checks
      const encryptedDir = path.join(this.config.baseUploadDir, this.config.encryptedSubDir);
      
      try {
        const diskFiles = await fs.readdir(encryptedDir);
        const zkBlobFiles = diskFiles.filter(f => f.endsWith(this.config.fileExtension));
        
        // Check for orphaned files (on disk but not in MongoDB)
        let orphanedFiles = 0;
        for (const file of zkBlobFiles) {
          const fileId = file.replace(this.config.fileExtension, '');
          const exists = await SharedFileModel.exists({ fileId });
          if (!exists) {
            orphanedFiles++;
          }
        }

        // Check for missing files (in MongoDB but not on disk)
        const mongoFiles = await SharedFileModel.find({}, { fileId: 1, filePath: 1 });
        let missingFiles = 0;
        for (const mongoFile of mongoFiles) {
          const filePath = mongoFile.filePath || this.generateFilePath(mongoFile.fileId);
          try {
            await fs.access(filePath);
          } catch {
            missingFiles++;
          }
        }

        if (orphanedFiles > 0) {
          issues.push(`Found ${orphanedFiles} orphaned files on disk`);
        }

        if (missingFiles > 0) {
          issues.push(`Found ${missingFiles} files missing from disk`);
        }

        return {
          isHealthy: issues.length === 0,
          totalFiles,
          corruptedFiles: invalidFiles,
          orphanedFiles,
          inconsistentMetadata: missingFiles,
          issues,
          checkedAt,
        };

      } catch (diskError) {
        issues.push(`Disk integrity check failed: ${diskError instanceof Error ? diskError.message : 'Unknown error'}`);
      }

    } catch (error) {
      issues.push(`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

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

  async getHealth(): Promise<RepositoryHealth> {
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      await this.ensureConnection();

      // Test MongoDB operation
      await SharedFileModel.countDocuments().limit(1);
      
      // Test disk access
      const encryptedDir = path.join(this.config.baseUploadDir, this.config.encryptedSubDir);
      await fs.access(encryptedDir);

      const responseTimeMs = Date.now() - startTime;
      const db = getDatabase();
      const isConnected = db.isConnected();

      return {
        isOperational: isConnected,
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        responseTimeMs,
        errorRate: 0,
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
        lastSuccessfulOperation: new Date(0),
        issues,
      };
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private generateFilePath(fileId: string): string {
    return path.join(
      this.config.baseUploadDir,
      this.config.encryptedSubDir,
      `${fileId}${this.config.fileExtension}`
    );
  }

  private async ensureConnection(): Promise<void> {
    const db = getDatabase();
    await db.connect();
  }

  /**
   * Map domain entity to database document (without blob)
   */
  private mapEntityToDocument(sharedFile: SharedFile, filePath: string): Partial<ISharedFileDocument> {
    const storageData = sharedFile.toStorageData();

    return {
      fileId: storageData.id,
      filePath: filePath, // Store disk path instead of blob
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
   * Map domain entity to update document (metadata only)
   */
  private mapEntityToUpdateDocument(sharedFile: SharedFile): Partial<ISharedFileDocument> {
    const storageData = sharedFile.toStorageData();

    return {
      downloadCount: storageData.downloadCount,
      isAvailable: !storageData.isDeleted,
      // Don't update: fileId, filePath, encryptedSize, uploadedAt, expiresAt, maxDownloads
    };
  }
}

/**
 * Factory function for creating disk file repository
 */
export const createDiskFileRepository = (baseUploadDir?: string): IFileRepository => {
  return new DiskFileRepository(baseUploadDir);
};
