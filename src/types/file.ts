/**
 * Centralized File Type System for UploadHaven
 * Replaces 6+ different FileData interfaces across the codebase
 *
 * Hierarchy:
 * BaseFileData -> ClientFileData & AdminFileData
 * UploadedFile (for upload process)
 */

// =============================================================================
// Core File Types
// =============================================================================

/**
 * File type classification
 */
export type FileType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'other';

/**
 * File upload status during processing
 */
export type FileUploadStatus =
  | 'scanning'
  | 'uploading'
  | 'encrypting'
  | 'completed'
  | 'error'  | 'threat_detected';

/**
 * Base file data structure - shared properties across all file interfaces
 */
export interface BaseFileData {
  readonly id: string;
  readonly name: string;
  readonly originalName: string;
  readonly originalType: string; // Original MIME type before encryption
  readonly size: number;
  readonly mimeType: string;
  readonly uploadDate: string;  readonly downloadCount: number;  readonly type: FileType;
  // Zero-Knowledge encryption fields
  readonly isZeroKnowledge: boolean;
  readonly zkMetadata?: {
    algorithm: string;
    iv: string;
    salt: string;
    iterations: number;
    encryptedSize: number;
    uploadTimestamp: number;
    keyHint?: 'password' | 'embedded';
    contentCategory?: 'media' | 'document' | 'archive' | 'text' | 'other';
  };
}

// =============================================================================
// Client-Side File Interfaces
// =============================================================================

/**
 * File data for client-side components (FileManager, user views)
 * Extends base with expiration and optional fields
 */
export interface ClientFileData extends BaseFileData {
  readonly expiresAt?: string | null;
  readonly shortUrl: string; // Short URL for file sharing and thumbnails
}

/**
 * File data during upload process with progress tracking
 */
export interface UploadedFile {
  readonly id: string;
  readonly file: File;
  progress: number;
  status: FileUploadStatus;
  url?: string;
  shortUrl?: string;
  error?: string;
  scanResult?: {
    safe: boolean;
    threat?: string;
  };
  generatedKey?: string;
}

// =============================================================================
// Admin-Side File Interfaces
// =============================================================================

/**
 * File data for admin components with user information
 */
export interface AdminFileData extends BaseFileData {
  readonly expiresAt: string | null;
  readonly userId?: string;
  readonly userName?: string;
  readonly isAnonymous: boolean;
}

/**
 * File data for export operations
 */
export interface ExportFileData {
  readonly id: string;
  readonly filename: string;
  readonly original_name: string;
  readonly size: number;
  readonly mime_type: string;
  readonly upload_date: Date;
  readonly download_count: number;
  readonly user_id?: string;
  readonly user_name?: string;
  readonly user_email?: string;
  readonly is_anonymous: boolean;
  readonly short_url: string;
  readonly expires_at?: Date;
}

// =============================================================================
// Database Model Interface
// =============================================================================

/**
 * Database model interface (MongoDB document structure)
 */
export interface IFile {
  readonly _id: string;
  readonly filename: string;
  readonly shortUrl: string;
  readonly originalName: string;
  readonly originalType: string; // Original MIME type before encryption
  readonly mimeType: string;
  readonly size: number;
  readonly uploadDate: Date;
  readonly expiresAt: Date;
  readonly downloadCount: number;
  readonly ipAddress: string;
  readonly userAgent?: string;
  readonly scanResult: {
    safe: boolean;
    threat?: string;
    scanDate?: Date;
  };
  readonly isDeleted: boolean;
  readonly userId?: string;
  readonly isAnonymous: boolean;  readonly password?: string; // hashed password for protected files
  readonly isPasswordProtected: boolean;
  // Zero-Knowledge encryption fields
  readonly isZeroKnowledge: boolean;
  readonly zkMetadata?: {
    algorithm: string;
    iv: string;
    salt: string;
    iterations: number;
    encryptedSize: number;
    uploadTimestamp: number;
    keyHint?: 'password' | 'embedded';
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// =============================================================================
// Type Guards & Utilities
// =============================================================================

/**
 * Type guard to check if object is ClientFileData
 */
export function isClientFileData(obj: unknown): obj is ClientFileData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    'name' in obj &&
    typeof (obj as Record<string, unknown>).name === 'string'
  );
}

/**
 * Type guard to check if object is AdminFileData
 */
export function isAdminFileData(obj: unknown): obj is AdminFileData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    'isAnonymous' in obj
  );
}

/**
 * Convert database model to client file data
 */
export function toClientFileData(dbFile: IFile): ClientFileData {
  return {
    id: dbFile._id,    name: dbFile.filename,
    originalName: dbFile.originalName,
    originalType: dbFile.originalType,
    size: dbFile.size,
    mimeType: dbFile.mimeType,
    uploadDate: dbFile.uploadDate.toISOString(),
    downloadCount: dbFile.downloadCount,
    type: getFileTypeFromMimeType(dbFile.originalType || dbFile.mimeType), // Use original type for ZK files
    expiresAt: dbFile.expiresAt?.toISOString() || null,
    shortUrl: dbFile.shortUrl,
    isZeroKnowledge: dbFile.isZeroKnowledge || false,
    zkMetadata: dbFile.zkMetadata,
  };
}

/**
 * Convert database model to admin file data
 */
export function toAdminFileData(
  dbFile: IFile,
  userName?: string
): AdminFileData {
  return {
    id: dbFile._id,
    name: dbFile.filename,
    originalName: dbFile.originalName,
    originalType: dbFile.originalType,
    size: dbFile.size,
    mimeType: dbFile.mimeType,
    uploadDate: dbFile.uploadDate.toISOString(),
    downloadCount: dbFile.downloadCount,    type: getFileTypeFromMimeType(dbFile.originalType || dbFile.mimeType), // Use original type for ZK files
    expiresAt: dbFile.expiresAt?.toISOString() || null,
    userId: dbFile.userId,
    userName: userName,
    isAnonymous: dbFile.isAnonymous,
    isZeroKnowledge: dbFile.isZeroKnowledge || false,
    zkMetadata: dbFile.zkMetadata,
  };
}

/**
 * Determine file type from MIME type
 */
export function getFileTypeFromMimeType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('word')
  )
    return 'document';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('archive') ||
    mimeType.includes('tar') ||
    mimeType.includes('gz')
  )
    return 'archive';
  return 'other';
}

/**
 * Determine file type from filename extension
 */
export function getFileTypeFromFilename(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext))
    return 'image';
  if (['mp4', 'webm', 'avi', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
  if (['pdf', 'txt', 'md', 'doc', 'docx'].includes(ext)) return 'document';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'other';
}
