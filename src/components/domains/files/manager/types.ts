// types.ts - Type definitions and interfaces for FileManager

// Import centralized types
import type { ClientFileData, FilePreviewData } from '@/types';

// Use centralized types for consistency
export type FileInfo = ClientFileData;

// Re-export FilePreviewData from centralized types
export type { FilePreviewData } from '@/types';

export interface ExpirationStatus {
  text: string;
  variant: "secondary" | "destructive";
  expired: boolean;
  isExpiringSoon: boolean;
  timeLeft: string;
}

export interface FileManagerProps {
  className?: string;
}

export interface FileCardProps {
  file: FileInfo;
  index: number;
  onPreview: (file: FileInfo) => void;
  onCopyLink: (filename: string) => void;
  onDownload: (filename: string) => void;
  onDelete: (filename: string) => void;
  getExpirationStatus: (expiresAt?: string | null) => ExpirationStatus;
  getFileIcon: (type: FileInfo["type"]) => React.ReactNode;
}

export interface FileManagerHeaderProps {
  filesCount: number;
  totalSize: number;
}

export interface FileListContainerProps {
  files: FileInfo[];
  onPreview: (file: FileInfo) => void;
  onCopyLink: (filename: string) => void;
  onDownload: (filename: string) => void;
  onDelete: (filename: string) => void;
  getExpirationStatus: (expiresAt?: string | null) => ExpirationStatus;
  getFileIcon: (type: FileInfo["type"]) => React.ReactNode;
}

export interface FileActionButtonsProps {
  onPreview: () => void;
  onCopyLink: () => void;
  onDownload: () => void;
  onDelete: () => void;
}
