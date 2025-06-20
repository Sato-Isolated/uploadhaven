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
  isActive: boolean; // Admin can suspend users
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database file model
 */
export interface IFile {
  _id: string;  filename: string;
  shortUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  expiresAt: Date;
  downloadCount: number;
  ipAddress: string;
  userAgent?: string;
  isDeleted: boolean;
  userId?: string;
  isAnonymous: boolean;password?: string; // hashed password for protected files
  isPasswordProtected: boolean;  // Zero-Knowledge encryption fields (client-side encryption)
  isZeroKnowledge: boolean; // True if file uses Zero-Knowledge encryption
  // Security fields
  ipHash?: string; // Hashed IP for security logging
  downloadLimit?: number; // Optional download limit
  zkMetadata?: {
    algorithm: string; // e.g., 'AES-GCM'
    iv: string; // base64 encoded IV (stored for client decryption)
    salt: string; // base64 encoded salt (for password-derived keys)
    iterations: number; // PBKDF2 iterations
    encryptedSize: number; // size of encrypted blob
    uploadTimestamp: number; // when encrypted blob was uploaded
    keyHint?: 'password' | 'embedded'; // hint for UI about key type
    contentCategory?: 'media' | 'document' | 'archive' | 'text' | 'other'; // General content type for preview
    // Original file metadata for ZK files
    originalType?: string; // Original MIME type before encryption
    originalName?: string; // Original filename before encryption
    originalSize?: string; // Original file size before encryption
  };
  createdAt: Date;
  updatedAt: Date;
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
  priority: 'low' | 'normal' | 'high' | 'urgent';  relatedFileId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
