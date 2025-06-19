// types.ts - File management types for dashboard domain

import type { ClientFileData } from '@/types';

// Re-export main file type for consistency
export type FileInfo = ClientFileData;

// File expiration status
export interface ExpirationStatus {
  text: string;
  variant: 'secondary' | 'destructive';
  expired: boolean;
  isExpiringSoon: boolean;
  timeLeft: string;
}

// Component props interfaces
export interface FilesManagerProps {
  className?: string;
}

export interface FilesContainerProps {
  files: FileInfo[];
  totalSize: number;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export interface FilesHeaderProps {
  filesCount: number;
  totalSize: number;
  onRefresh?: () => void;
}

export interface FilesListProps {
  files: FileInfo[];
  onDelete?: (file: FileInfo) => void;
  deleteLoading?: boolean;
}

export interface FilesListItemProps {
  file: FileInfo;
  index: number;
  onDelete?: (file: FileInfo) => void;
  deleteLoading?: boolean;
}

export interface FilesActionsProps {
  onDelete?: () => void;
  disabled?: boolean;
}

export interface FilesIconProps {
  type: FileInfo['type'];
  className?: string;
}

export interface FilesThumbnailProps {
  mimeType: string;
  size?: number;
  className?: string;
}

export interface FilesEmptyStateProps {
  className?: string;
}

export interface FilesLoadingStateProps {
  className?: string;
}

export interface FilesErrorStateProps {
  error?: string;
  onRetry?: () => void;
  className?: string;
}
