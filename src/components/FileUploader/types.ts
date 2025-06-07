// types.ts - Type definitions and constants for FileUploader

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "scanning" | "uploading" | "completed" | "error" | "threat_detected";
  url?: string;
  shortUrl?: string;
  error?: string;
  scanResult?: { safe: boolean; threat?: string };
  generatedKey?: string;
}

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/pdf",
  "application/zip",
  "video/mp4",
  "audio/mpeg",
];

export const EXPIRATION_OPTIONS = [
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "never", label: "Never" },
];

export interface FileUploaderSettings {
  expiration: string;
  isPasswordProtected: boolean;
}

export interface FileProgressProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onCopyToClipboard: (url: string, label?: string) => void;
}

export interface UploadSettingsProps {
  expiration: string;
  isPasswordProtected: boolean;
  onExpirationChange: (value: string) => void;
  onPasswordProtectionChange: (value: boolean) => void;
}

export interface DropzoneProps {
  isDragActive: boolean;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
}
