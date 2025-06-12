// types.ts - Type definitions and constants for FileUploader

// Import and re-export centralized types
export type {
  UploadedFile,
  FileUploaderSettings,
  FileProgressProps,
  UploadSettingsProps,
  DropzoneProps,
  FileUploadStatus,
} from '@/types';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/pdf',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
];

export const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'never', label: 'Never' },
];
