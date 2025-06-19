// Dashboard Types following SRP principles
// Shared TypeScript interfaces for the refactored user dashboard

import type { ReactNode } from 'react';
import type { BaseComponentProps } from '@/types';

// ========================================
// Main Dashboard Types
// ========================================

export interface DashboardProps extends BaseComponentProps {
  session: {
    user: {
      id: string;
      name?: string;
      email: string;
    };
  };
}

export interface DashboardContainerProps extends BaseComponentProps {
  children: ReactNode;
}

// ========================================
// Layout Component Types
// ========================================

export interface DashboardHeaderProps extends BaseComponentProps {
  userName: string;
}

export interface DashboardNavigationProps extends BaseComponentProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export interface DashboardSidebarProps extends BaseComponentProps {
  isOpen: boolean;
  onToggle: () => void;
}

// ========================================
// Stats Component Types
// ========================================

export interface UserStatsData {
  totalFiles: number;
  totalSize: number;
  recentUploads: number;
  expiringSoon: number;
  filesThisWeek: number;
  averageFileSize: number;
  mostUsedType: string;
  lastUpload?: string;
}

export interface UserStatsGridProps extends BaseComponentProps {
  stats: UserStatsData;
  isLoading?: boolean;
  statsError?: Error | null;
}

export interface UserStatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

// ========================================
// Upload Component Types
// ========================================

export interface UploadSettings {
  expiration: string;
  isPasswordProtected: boolean;
  password?: string;
  allowDownload: boolean;
  downloadLimit?: number;
}

export interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error' | 'pending';
  progress: number;
  url?: string;
  shareUrl?: string;
  error?: string;
  settings: UploadSettings;
}

export interface UploadAreaProps extends BaseComponentProps {
  onFileUpload?: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export interface UploadDropzoneProps extends BaseComponentProps {
  onFileDrop: (files: File[]) => void;
  isDisabled?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export interface UploadProgressProps extends BaseComponentProps {
  files: UploadedFile[];
  onCancel?: (fileId: string) => void;
}

export interface UploadSettingsProps extends BaseComponentProps {
  settings: UploadSettings;
  onChange: (settings: Partial<UploadSettings>) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export interface UploadedFilesListProps extends BaseComponentProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onClearCompleted: () => void;
  onShareFile?: (id: string) => void;
}

export interface FilePreviewProps extends BaseComponentProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  onShare?: (id: string) => void;
  onDownload?: (id: string) => void;
}

// ========================================
// Action Component Types
// ========================================
// Action components simplified - QuickAction functionality removed

export interface ActionModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

// ========================================
// Activity Component Types
// ========================================

export interface ActivityItem {
  id: string;
  type: 'upload' | 'download' | 'delete' | 'share' | 'view';
  description: string;
  timestamp: string;
  fileId?: string;
  fileName?: string;
  metadata?: Record<string, unknown>;
}

export interface RecentActivityFeedProps extends BaseComponentProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface ActivityItemProps extends BaseComponentProps {
  activity: ActivityItem;
  onClick?: (activityId: string) => void;
}

export interface ActivityFilterProps extends BaseComponentProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export interface ActivityLoadMoreProps extends BaseComponentProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

// ========================================
// State Component Types
// ========================================

export interface DashboardLoadingStateProps extends BaseComponentProps {
  message?: string;
}

export interface DashboardErrorStateProps extends BaseComponentProps {
  dashboardError: Error;
  onRetry?: () => void;
  onReset?: () => void;
}

export interface EmptyDashboardStateProps extends BaseComponentProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface UnauthorizedStateProps extends BaseComponentProps {
  onSignIn?: () => void;
  redirectUrl?: string;
}

// ========================================
// Hook Return Types
// ========================================

export interface UseDashboardDataReturn {
  user: DashboardProps['session']['user'];
  stats: UserStatsData;
  recentActivity: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
  refreshAll: () => void;
}

export interface UseUserStatsReturn {
  stats: UserStatsData | undefined;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export interface UseUploadManagerReturn {
  files: UploadedFile[];
  settings: UploadSettings;
  uploadFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  updateSettings: (settings: Partial<UploadSettings>) => void;
  clearCompleted: () => void;
  isUploading: boolean;
}

export interface UseRecentActivityReturn {
  activities: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
  hasMore: boolean;
  refresh: () => void;
}

export interface UseDashboardActionsReturn {
  executeAction: (actionId: string) => void;
  isExecuting: boolean;
}

// ========================================
// Utility Types
// ========================================

export type DashboardSection = 'overview' | 'files' | 'analytics' | 'activity' | 'settings';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type FileUploadStatus = 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface DashboardNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ========================================
// Event Types
// ========================================

export interface DashboardEvents {
  onStatsRefresh: () => void;
  onFileUpload: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  onActionExecute: (actionId: string) => void;
  onActivityLoad: () => void;
  onError: (error: Error) => void;
  onNotification: (notification: DashboardNotification) => void;
}

// ========================================
// Configuration Types
// ========================================

export interface DashboardConfig {
  maxUploadSize: number;
  allowedFileTypes: string[];
  maxFilesPerUpload: number;
  autoRefreshInterval: number;
  enableRealTime: boolean;
  enableNotifications: boolean;
}

export interface DashboardTheme {
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
}
