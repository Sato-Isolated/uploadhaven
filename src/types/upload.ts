/**
 * File Upload Types for UploadHaven
 * Handles file upload operations, settings, and component props
 */

// =============================================================================
// Upload Operations
// =============================================================================

/**
 * Options for file upload operations
 */
export interface FileUploadOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

/**
 * Options for file delete operations
 */
export interface FileDeleteOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Options for file operations
 */
export interface FileOperationOptions {
  loading?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

// =============================================================================
// Upload Status and Files
// =============================================================================

/**
 * File upload status
 */
export type FileUploadStatus =
  | 'uploading'
  | 'completed'
  | 'error';

/**
 * Uploaded file with metadata
 */
export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: FileUploadStatus;
  url?: string;
  shortUrl?: string;
  error?: string;
  generatedKey?: string;
}

/**
 * File uploader configuration
 */
export interface FileUploaderSettings {
  expiration: string;
  isPasswordProtected: boolean;
}

/**
 * Processing file type
 */
export type ProcessingFile = UploadedFile & {
  id: string;
  progress: number;
  status: FileUploadStatus;
  error?: string;
  url?: string;
  expiresAt?: string;
};

// =============================================================================
// File Display and Preview
// =============================================================================

/**
 * File data for preview components
 */
export interface FileData {
  filename: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
}

/**
 * Extended file with additional information
 */
export interface ExtendedFile {
  id: string;
  filename: string;
  fileSize: number;
  fileType?: string;
  uploadedAt: string;
  shortUrl?: string;
  downloadCount?: number;
  expiresAt?: string;
  userId?: string;
  isPasswordProtected?: boolean;
}

/**
 * Information about file type characteristics
 */
export interface FileTypeInfo {
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isText: boolean;
  isPdf: boolean;
  isCode: boolean;
}

/**
 * File metadata from API
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt?: string;
  downloadCount: number;
  isPasswordProtected: boolean;
}

// =============================================================================
// Component Props for Upload Operations
// =============================================================================

import type { BaseComponentProps } from './components';

/**
 * Props for file handler components
 */
export interface FileHandlerProps extends BaseComponentProps {
  file: UploadedFile;
  onRemoveFile?: (id: string) => void;
  onCopyToClipboard?: (url: string, label?: string) => void;
}

/**
 * Props for file status components
 */
export interface FileStatusProps extends BaseComponentProps {
  status: FileUploadStatus;
}

/**
 * Props for file progress components
 */
export interface FileProgressProps extends BaseComponentProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onCopyToClipboard: (url: string, label?: string) => void;
}

/**
 * Props for upload settings components
 */
export interface UploadSettingsProps extends BaseComponentProps {
  expiration: string;
  isPasswordProtected: boolean;
  onExpirationChange: (value: string) => void;
  onPasswordProtectionChange: (value: boolean) => void;
}

/**
 * Props for dropzone components
 */
export interface DropzoneProps extends BaseComponentProps {
  isDragActive: boolean;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
}

/**
 * Props for file preview components
 */
export interface FilePreviewProps extends BaseComponentProps {
  file: FileData;
}

/**
 * Props for file action components
 */
export interface FileActionProps extends BaseComponentProps {
  file: FileData;
  onDownload?: (file: FileData) => void;
  onOpenInNewTab?: (file: FileData) => void;
}

/**
 * Props for file info components
 */
export interface FileInfoProps extends BaseComponentProps {
  file: FileData;
}
