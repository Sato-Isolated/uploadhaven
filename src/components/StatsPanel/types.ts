// Types for StatsPanel components
export interface Stats {
  totalFiles: number;
  totalSize: string;
  totalSizeBytes: number;
  last24hUploads: number;
  last7dUploads: number;
  totalDownloads: number;
  fileTypeDistribution: Array<{
    _id: string;
    count: number;
    totalSize: number;
  }>;
}

export interface StatsHeaderProps {
  onRefresh: () => void;
}

export interface StatsGridProps {
  stats: Stats;
}

export interface SystemStatusProps {
  stats: Stats;
}

export interface ManagementActionsProps {
  stats: Stats;
  onRunCleanup: () => Promise<void>;
  onBulkDeleteAll: () => Promise<void>;
  bulkDeleting: boolean;
}

export interface SystemInformationProps {
  stats: Stats;
}
