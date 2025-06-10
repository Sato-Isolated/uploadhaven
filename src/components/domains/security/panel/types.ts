// Import types for local use
import type {
  SecurityEvent,
  SecurityStats,
  SecuritySeverity,
  SecurityEventType,
  ApiResponse,
  PaginationData,
  BaseComponentProps,
  DataComponentProps,
  ActionComponentProps,
} from "@/types";

// SecurityPanel-specific types that don't exist in common
export interface SecurityEventAPI extends SecurityEvent {
  // API-specific fields
  filename?: string;
  fileSize?: number;
  endpoint?: string;
  reason?: string;
  message?: string;
}

export interface SecurityApiResponse {
  stats: SecurityStats;
  events: SecurityEventAPI[];
}

// Component props interfaces using centralized base types
export interface SecurityHeaderProps extends BaseComponentProps {
  stats?: SecurityStats;
  title?: string;
  description?: string;
}

export interface SecurityActionsProps extends ActionComponentProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onClear?: () => void;
  onClearLogs?: () => void;
  isLoading?: boolean;
}

export interface SecurityStatsGridProps
  extends DataComponentProps<SecurityStats> {
  stats: SecurityStats;
  isLoading?: boolean;
}

export interface SecurityEventsListProps extends BaseComponentProps {
  events: SecurityEvent[];
  isLoading?: boolean;
}

export interface SecurityStatCardProps extends BaseComponentProps {
  title: string;
  value: number | string;
  icon: React.ReactNode; // Changed to ReactNode to accept JSX elements
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Handler function types
export type SecurityDataHandler = () => Promise<void>;
export type SecurityExportHandler = () => Promise<void>;
export type SecurityClearHandler = () => Promise<void>;

// Utility function types
export type GetSeverityColorFunction = (severity: SecuritySeverity) => string;
export type GetEventIconFunction = (type: SecurityEventType) => React.ReactNode;
export type FormatTimestampFunction = (timestamp: Date | string) => string;
