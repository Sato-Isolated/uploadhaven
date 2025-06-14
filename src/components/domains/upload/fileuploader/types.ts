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

export const EXPIRATION_VALUES = ['1h', '24h', '7d', '30d', 'never'] as const;

// Use this function in components to get translated labels
// Example: getExpirationOptions(t) where t = useTranslations('Expiration')
export function getExpirationOptions(t: (key: string) => string) {
  return EXPIRATION_VALUES.map((value) => ({
    value,
    label: t(value),
  }));
}
