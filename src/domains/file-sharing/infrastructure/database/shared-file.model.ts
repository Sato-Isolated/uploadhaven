/**
 * MongoDB Document Schema - Zero-knowledge file storage schema
 * 
 * Defines the MongoDB schema for storing encrypted files with privacy guarantees.
 * Enforces zero-knowledge principles at the database level.
 * 
 * @domain file-sharing
 * @pattern Infrastructure Schema (DDD)
 * @privacy zero-knowledge - stores only encrypted blobs and public metadata
 */

import mongoose from 'mongoose';

/**
 * MongoDB document interface for shared files
 * 
 * Key privacy principles:
 * - Only encrypted blobs stored (no plaintext)
 * - No user identification or tracking
 * - Minimal metadata (only what's needed for sharing)
 * - TTL-based automatic cleanup
 */
export interface ISharedFileDocument {
  readonly _id: mongoose.Types.ObjectId;
  readonly fileId: string; // Public file identifier
  readonly encryptedBlob?: Buffer; // AES-256-GCM encrypted file content (optional for disk storage)
  readonly filePath?: string; // Path to encrypted file on disk (optional for disk storage)
  readonly iv: string; // Public initialization vector
  readonly encryptedSize: number; // Size of encrypted blob
  readonly uploadedAt: Date; // Upload timestamp
  readonly expiresAt: Date; // TTL for automatic deletion
  readonly maxDownloads: number; // Download limit
  readonly downloadCount: number; // Current download count
  readonly isAvailable: boolean; // Soft deletion flag

  // Privacy guarantee: NO sensitive metadata stored
  // ❌ NO: originalFilename, mimeType, userAgent, ipAddress, userId
}

/**
 * MongoDB schema for zero-knowledge file storage
 */
const sharedFileSchema = new mongoose.Schema<ISharedFileDocument>(
  {
    // =============================================================================
    // Public Identifiers
    // =============================================================================

    fileId: {
      type: String,
      required: true,
      unique: true,
      index: true, // For fast lookups by file ID
      minlength: 10,
      maxlength: 10, // Fixed-length file IDs
    },    // =============================================================================
    // Encrypted Content (Zero-Knowledge)
    // =============================================================================

    encryptedBlob: {
      type: Buffer,
      required: false, // Optional for disk storage
      // Note: No validation on content - it's encrypted and opaque
    },

    filePath: {
      type: String,
      required: false, // Optional for MongoDB storage
      // Path to encrypted file on disk
    },

    iv: {
      type: String,
      required: true,
      length: 24, // Base64-encoded 16-byte IV
    },

    // =============================================================================
    // Public Metadata (Privacy-Safe)
    // =============================================================================

    encryptedSize: {
      type: Number,
      required: true,
      min: 1,
      max: 100 * 1024 * 1024, // 100MB limit
    },

    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true, // For analytics and cleanup queries
    }, expiresAt: {
      type: Date,
      required: true,
      // TTL index defined separately below with expireAfterSeconds
    },

    // =============================================================================
    // Download Management
    // =============================================================================

    maxDownloads: {
      type: Number,
      required: true,
      min: 1,
      max: 1000, // Reasonable limit
      default: 10,
    },

    downloadCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // =============================================================================
    // Availability Status
    // =============================================================================

    isAvailable: {
      type: Boolean,
      required: true,
      default: true,
      index: true, // For filtering available files
    },
  },
  {
    // Schema options
    timestamps: false, // We handle timestamps manually for privacy
    versionKey: false, // No __v field needed

    // Optimize for read performance
    collection: 'shared_files',

    // Transform function to clean up output
    toJSON: {
      transform: function (doc, ret) {
        // Remove MongoDB-specific fields from JSON output
        delete ret._id;
        return ret;
      }
    }
  }
);

// =============================================================================
// Indexes for Performance and TTL
// =============================================================================

// TTL index for automatic deletion of expired files
sharedFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for availability queries
sharedFileSchema.index({
  isAvailable: 1,
  expiresAt: 1
}, {
  name: 'availability_ttl_idx'
});

// Compound index for download limit checks
sharedFileSchema.index({
  fileId: 1,
  downloadCount: 1,
  maxDownloads: 1
}, {
  name: 'download_limits_idx'
});

// Index for cleanup operations
sharedFileSchema.index({
  uploadedAt: 1,
  isAvailable: 1
}, {
  name: 'cleanup_idx'
});

// =============================================================================
// Instance Methods (Privacy-Aware)
// =============================================================================

/**
 * Check if file can be downloaded
 */
sharedFileSchema.methods.canDownload = function (): boolean {
  return this.isAvailable &&
    this.expiresAt > new Date() &&
    this.downloadCount < this.maxDownloads;
};

/**
 * Increment download count (with validation)
 */
sharedFileSchema.methods.incrementDownloadCount = function (): void {
  if (!this.canDownload()) {
    throw new Error('File is not available for download');
  }
  this.downloadCount += 1;
};

/**
 * Soft delete the file
 */
sharedFileSchema.methods.softDelete = function (): void {
  this.isAvailable = false;
};

/**
 * Get remaining downloads
 */
sharedFileSchema.methods.getRemainingDownloads = function (): number {
  return Math.max(0, this.maxDownloads - this.downloadCount);
};

// =============================================================================
// Static Methods (Query Helpers)
// =============================================================================

/**
 * MongoDB model interface with custom static methods
 */
interface ISharedFileModel extends mongoose.Model<ISharedFileDocument> {
  findAvailableById(fileId: string): Promise<ISharedFileDocument | null>;
  findExpiredFiles(limit?: number): Promise<ISharedFileDocument[]>;
  getStorageStats(): Promise<Array<{
    totalFiles: number;
    totalSize: number;
    availableFiles: number;
  }>>;
}

/**
 * Find available file by ID
 */
sharedFileSchema.statics.findAvailableById = function (fileId: string) {
  return this.findOne({
    fileId,
    isAvailable: true,
    expiresAt: { $gt: new Date() },
    $expr: { $lt: ['$downloadCount', '$maxDownloads'] }
  });
};

/**
 * Find expired files for cleanup
 */
sharedFileSchema.statics.findExpiredFiles = function (limit: number = 100) {
  return this.find({
    $or: [
      { expiresAt: { $lte: new Date() } },
      { $expr: { $gte: ['$downloadCount', '$maxDownloads'] } }
    ]
  }).limit(limit);
};

/**
 * Get storage statistics (privacy-safe)
 */
sharedFileSchema.statics.getStorageStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$encryptedSize' },
        availableFiles: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$isAvailable', true] },
                  { $gt: ['$expiresAt', new Date()] },
                  { $lt: ['$downloadCount', '$maxDownloads'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// =============================================================================
// Model Export
// =============================================================================

// Prevent multiple model compilation
const modelName = 'SharedFile';
export const SharedFileModel = (mongoose.models[modelName] ||
  mongoose.model<ISharedFileDocument, ISharedFileModel>(modelName, sharedFileSchema)) as ISharedFileModel;

export default SharedFileModel;
