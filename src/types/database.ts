/**
 * Database Models for UploadHaven
 * Handles database interfaces and data models
 */

// =============================================================================
// Database Models
// =============================================================================

/**
 * Database user model
 */
export interface IUser {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: 'user' | 'admin';
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database file model
 */
export interface IFile {
  _id: string;
  filename: string;
  shortUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  expiresAt: Date;
  downloadCount: number;
  ipAddress: string;
  userAgent?: string;
  scanResult: {
    safe: boolean;
    threat?: string;
    scanDate?: Date;
  };
  isDeleted: boolean;
  userId?: string;
  isAnonymous: boolean;
  password?: string; // hashed password for protected files
  isPasswordProtected: boolean;
  // Encryption fields
  isEncrypted: boolean;
  encryptionMetadata?: {
    salt: string; // base64 encoded salt for key derivation
    iv: string; // base64 encoded initialization vector
    tag: string; // base64 encoded authentication tag
    algorithm: string; // encryption algorithm used (e.g., 'aes-256-gcm')
    iterations: number; // PBKDF2 iterations for key derivation
    encryptedSize: number; // size of encrypted file data
  };
  // Preview encryption (for Phase 2)
  previewEncryptionMetadata?: {
    salt: string;
    iv: string;
    tag: string;
    algorithm: string;
    iterations: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database security event model
 */
export interface ISecurityEvent {
  _id: string;
  type: string;
  timestamp: Date;
  ip: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
  userAgent?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Database notification model
 */
export interface INotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  relatedFileId?: string;
  relatedSecurityEventId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
