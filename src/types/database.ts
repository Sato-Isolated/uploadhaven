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
  role: "user" | "admin";
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
  severity: "low" | "medium" | "high";
  userAgent?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
