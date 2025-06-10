/**
 * Centralized Type Exports for UploadHaven
 * Single source of truth for all type definitions
 * 
 * Import pattern: import { FileData, ApiResponse } from '@/types'
 */

// =============================================================================
// File-related types
// =============================================================================
export type {
  FileType,
  BaseFileData,
  ClientFileData,
  FilePreviewData,
  AdminFileData,
  ExportFileData,
} from './file';

export {
  isClientFileData,
  isAdminFileData,
  toClientFileData,
  toAdminFileData,
  getFileTypeFromMimeType,
  getFileTypeFromFilename,
} from './file';

// =============================================================================
// API and Response types
// =============================================================================
export type {
  ApiResponse,
  PaginationData,
  PaginationState,
  UsePaginationOptions,
  BaseFilters,
  ApiState,
  ApiOptions,
} from './api';

// =============================================================================
// Component Props and UI State
// =============================================================================
export type {
  BaseComponentProps,
  DataComponentProps,
  ActionComponentProps,
  ModalState,
  HookModalState,
  UseModalReturn,
  LoadingState,
  AsyncOperationState,
  AsyncOperationOptions,
} from './components';

// =============================================================================
// Events and Activities
// =============================================================================
export type {
  BaseEvent,
  ActivityEvent,
  ActivityResponse,
  SecuritySeverity,
  SecurityEventType,
  SecurityEvent,
} from './events';

// =============================================================================
// Authentication and Users
// =============================================================================
export type {
  BaseUser,
  ExtendedUser,
  User,
} from './auth';

// =============================================================================
// Database Models
// =============================================================================
export type {
  IUser,
  IFile,
  ISecurityEvent,
} from './database';

// =============================================================================
// Security and Scanning
// =============================================================================
export type {
  ScanResult,
  VirusTotalResponse,
  RateLimitConfig,
  RateLimitData,
  CleanupStats,
  DailyQuota,
} from './security';

// =============================================================================
// Statistics and Analytics
// =============================================================================
export type {
  BaseStats,
  UserStats,
  SecurityStats,
} from './stats';

// =============================================================================
// File Upload and Management
// =============================================================================
export type {
  FileUploadOptions,
  FileDeleteOptions,
  FileOperationOptions,
  FileUploadStatus,
  UploadedFile,
  FileUploaderSettings,
  ProcessingFile,
  FileData,
  ExtendedFile,
  FileTypeInfo,
  FileMetadata,
  FileHandlerProps,
  FileStatusProps,
  FileProgressProps,
  UploadSettingsProps,
  DropzoneProps,
  FilePreviewProps,
  FileActionProps,
  FileInfoProps,
} from './upload';

// =============================================================================
// Hook Configuration
// =============================================================================
export type {
  PollingOptions,
} from './hooks';

// =============================================================================
// Utility Types
// =============================================================================
export type {
  CallbackFunction,
  AsyncCallbackFunction,
  TimeRange,
  ExportDataType,
} from './utils';

// =============================================================================
// Legacy Type Aliases (for backward compatibility during migration)
// =============================================================================

import type { ClientFileData } from './file';

/**
 * @deprecated Use ClientFileData instead
 */
export type FileInfo = ClientFileData;
