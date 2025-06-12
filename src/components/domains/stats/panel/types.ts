// StatsPanel Types and Interfaces

import type {
  BaseStats,
  UserStats,
  BaseComponentProps,
  DataComponentProps,
  ActionComponentProps,
} from '@/types';

// Re-export centralized types for component usage
export type { BaseStats, UserStats };

// StatsPanel-specific types that extend centralized types
export interface Stats extends Omit<BaseStats, 'totalSize'> {
  totalSize: string; // formatted size string
  totalSizeBytes: number; // raw bytes from BaseStats
  last24hUploads: number;
  last7dUploads: number;
  totalDownloads: number;
  fileTypeDistribution: Array<{
    _id: string;
    count: number;
    totalSize: number;
  }>;
}

export interface StatsHeaderProps extends BaseComponentProps {
  onRefresh: () => void;
}

export interface StatsGridProps extends DataComponentProps<Stats> {
  stats: Stats;
}

export interface SystemStatusProps extends DataComponentProps<Stats> {
  stats: Stats;
}

export interface ManagementActionsProps extends ActionComponentProps {
  stats: Stats;
  onRunCleanup: () => Promise<void>;
  onBulkDeleteAll: () => Promise<void>;
  bulkDeleting: boolean;
}

export interface SystemInformationProps extends DataComponentProps<Stats> {
  stats: Stats;
}
