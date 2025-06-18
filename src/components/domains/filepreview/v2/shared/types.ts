/**
 * Shared type definitions for the new FilePreview v2 architecture
 * ZK-ONLY system - all files are Zero-Knowledge encrypted
 */

/**
 * Base file information returned by /api/file-info/[shortUrl]
 */
export interface FileInfoResponse {
  success: boolean;
  data: FileInfoData;
}

export interface FileInfoData {
  shortUrl: string;
  isPasswordProtected: boolean;
  isExpired: boolean;
  expiresAt?: string;
  
  // ZK file metadata (all files are ZK encrypted)
  zkMetadata: ZKFileMetadata;
}

/**
 * Metadata for Zero-Knowledge encrypted files
 */
export interface ZKFileMetadata {
  contentCategory: 'media' | 'document' | 'archive' | 'text' | 'other';
  algorithm: string;
  keyDerivation: {
    algorithm: string;
    iterations: number;
  };
  keyHint: 'url-fragment' | 'password-protected' | 'embedded';
  // Additional ZK-specific metadata without sensitive info
  encryptedSize: number;
  uploadDate: string;
  // Additional fields that come from the real API response
  iv?: string;
  salt?: string;
  iterations?: number;
  uploadTimestamp?: number;
  originalType?: string;
  originalName?: string;
  originalSize?: number;
}

/**
 * Props for the main FilePreviewRouter component
 */
export interface FilePreviewRouterProps {
  shortUrl: string;
  className?: string;
}

/**
 * Props for ZKFilePreview component  
 */
export interface ZKFilePreviewProps {
  fileInfo: FileInfoData;
  shortUrl: string;
}

/**
 * State for ZK file preview (all files are ZK now)
 */
export interface ZKFileState {
  fileInfo: FileInfoData | null;
  isLoading: boolean;
  error: string | null;
  
  // Key management
  hasKey: boolean;
  keySource: 'url-fragment' | 'user-input' | null;
  keyInput: string;
  
  // Decryption
  isDecrypting: boolean;
  decryptionError: string | null;
  decryptedBlob: Blob | null;
  decryptedBlobURL: string | null;
  decryptedMetadata: DecryptedFileMetadata | null;
  
  // Actions
  isDownloading: boolean;
}

/**
 * Metadata for decrypted files (extracted from ZK files)
 */
export interface DecryptedFileMetadata {
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * ZK encryption metadata for decryption
 */
export interface ZKEncryptionMetadata {
  iv: string;
  salt: string;
  algorithm: string;
  iterations: number;
  size: number;
  uploadTimestamp: number;
}

/**
 * Common loading state types
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Error types for better error handling
 */
export interface PreviewError {
  type: 'network' | 'authentication' | 'decryption' | 'file-not-found' | 'expired' | 'unknown';
  message: string;
  code?: string;
}

/**
 * Props for shared preview components (Image, Video, etc.)
 */
export interface PreviewComponentProps {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  className?: string;
}

/**
 * Content category mapping for ZK files
 */
export const CONTENT_CATEGORY_MIME_MAP = {
  media: 'image/jpeg', // Fallback MIME for preview type detection
  document: 'application/pdf',
  archive: 'application/zip',
  text: 'text/plain',
  other: 'application/octet-stream',
} as const;

/**
 * Utility function to get display MIME type for ZK files based on content category
 */
export function getDisplayMimeType(fileInfo: FileInfoData): string {
  return CONTENT_CATEGORY_MIME_MAP[fileInfo.zkMetadata.contentCategory] || 'application/octet-stream';
}

/**
 * Utility function to get display filename for ZK files (before decryption)
 */
export function getDisplayFilename(fileInfo: FileInfoData): string {
  // For ZK files, we can't show the real filename until decryption
  return `Encrypted File (${fileInfo.zkMetadata.contentCategory})`;
}

/**
 * Utility function to get file size for display
 */
export function getDisplayFileSize(fileInfo: FileInfoData): number {
  return fileInfo.zkMetadata.encryptedSize;
}
