/**
 * File Repository Interface - Data persistence contract for file sharing
 * 
 * Defines the contract for storing and retrieving shared files.
 * Enforces zero-knowledge principles at the repository level.
 * 
 * @domain file-sharing
 * @pattern Repository Interface (DDD)
 * @privacy zero-knowledge - no sensitive data in storage operations
 */

import { SharedFile } from '../../domain/entities/shared-file.entity';
import { FileId } from '../../domain/value-objects/file-id.vo';

/**
 * Repository interface for shared file persistence
 * 
 * Key principles:
 * - Zero-knowledge: Store only encrypted blobs and public metadata
 * - Anonymous: No user association in storage
 * - Ephemeral: Support TTL-based cleanup
 * - Privacy-safe: No sensitive metadata storage
 */
export interface IFileRepository {
  // =============================================================================
  // Core CRUD Operations
  // =============================================================================

  /**
   * Store a new shared file
   * Only stores encrypted blob and privacy-safe metadata
   * 
   * @param sharedFile - The shared file entity to store
   * @returns Promise<void>
   * @throws Error if storage fails
   */
  store(sharedFile: SharedFile): Promise<void>;

  /**
   * Find a shared file by its ID
   * Returns null if not found or if file is deleted/expired
   * 
   * @param fileId - The file identifier
   * @returns Promise<SharedFile | null>
   */
  findById(fileId: FileId): Promise<SharedFile | null>;

  /**
   * Update an existing shared file
   * Used for download count updates, soft deletion, etc.
   * 
   * @param sharedFile - The updated shared file entity
   * @returns Promise<void>
   * @throws Error if file not found or update fails
   */
  update(sharedFile: SharedFile): Promise<void>;

  /**
   * Hard delete a file from storage
   * Used for expired files cleanup
   * 
   * @param fileId - The file identifier
   * @returns Promise<void>
   */
  delete(fileId: FileId): Promise<void>;

  // =============================================================================
  // Query Operations
  // =============================================================================

  /**
   * Check if a file exists and is available for download
   * 
   * @param fileId - The file identifier
   * @returns Promise<boolean>
   */
  exists(fileId: FileId): Promise<boolean>;

  /**
   * Get file metadata without the encrypted blob
   * Used for file info API endpoints
   * 
   * @param fileId - The file identifier
   * @returns Promise<{size: number, expiresAt: Date, remainingDownloads: number} | null>
   */
  getMetadata(fileId: FileId): Promise<{
    size: number;
    expiresAt: Date;
    remainingDownloads: number;
    isAvailable: boolean;
  } | null>;

  // =============================================================================
  // Bulk Operations
  // =============================================================================

  /**
   * Find files that have expired and need cleanup
   * Used by background cleanup jobs
   * 
   * @param limit - Maximum number of files to return
   * @returns Promise<FileId[]>
   */
  findExpiredFiles(limit?: number): Promise<FileId[]>;

  /**
   * Find files with exhausted download limits
   * Used by background cleanup jobs
   * 
   * @param limit - Maximum number of files to return
   * @returns Promise<FileId[]>
   */
  findExhaustedFiles(limit?: number): Promise<FileId[]>;

  /**
   * Bulk delete multiple files
   * Used for efficient cleanup operations
   * 
   * @param fileIds - Array of file identifiers to delete
   * @returns Promise<number> - Number of files actually deleted
   */
  bulkDelete(fileIds: FileId[]): Promise<number>;

  // =============================================================================
  // Statistics & Monitoring (Privacy-Safe)
  // =============================================================================

  /**
   * Get total number of active files
   * Excludes deleted and expired files
   * 
   * @returns Promise<number>
   */
  getActiveFileCount(): Promise<number>;

  /**
   * Get total storage used by active files (in bytes)
   * 
   * @returns Promise<number>
   */
  getTotalStorageUsed(): Promise<number>;

  /**
   * Get privacy-safe statistics
   * No sensitive data, aggregated metrics only
   * 
   * @returns Promise<FileStorageStats>
   */
  getStorageStats(): Promise<FileStorageStats>;

  // =============================================================================
  // Maintenance Operations
  // =============================================================================

  /**
   * Cleanup expired and exhausted files
   * Returns number of files cleaned up
   * 
   * @returns Promise<{expired: number, exhausted: number}>
   */
  cleanup(): Promise<{
    expired: number;
    exhausted: number;
  }>;

  /**
   * Verify storage integrity
   * Checks for orphaned files, corrupted data, etc.
   * 
   * @returns Promise<StorageIntegrityReport>
   */
  verifyIntegrity(): Promise<StorageIntegrityReport>;

  /**
   * Get repository health status
   * 
   * @returns Promise<RepositoryHealth>
   */
  getHealth(): Promise<RepositoryHealth>;
}

// =============================================================================
// Supporting Types
// =============================================================================

/**
 * Privacy-safe file storage statistics
 */
export interface FileStorageStats {
  readonly activeFiles: number;
  readonly totalSizeBytes: number;
  readonly averageFileSizeBytes: number;
  readonly oldestFileAge: number; // in hours
  readonly filesExpiringSoon: number; // within 24 hours
  readonly filesNearDownloadLimit: number; // >80% downloads used
}

/**
 * Storage integrity report
 */
export interface StorageIntegrityReport {
  readonly isHealthy: boolean;
  readonly totalFiles: number;
  readonly corruptedFiles: number;
  readonly orphanedFiles: number;
  readonly inconsistentMetadata: number;
  readonly issues: string[];
  readonly checkedAt: Date;
}

/**
 * Repository health status
 */
export interface RepositoryHealth {
  readonly isOperational: boolean;
  readonly connectionStatus: 'connected' | 'disconnected' | 'degraded';
  readonly responseTimeMs: number;
  readonly errorRate: number; // percentage
  readonly lastSuccessfulOperation: Date;
  readonly issues: string[];
}
