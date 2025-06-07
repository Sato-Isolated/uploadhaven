export interface SecurityEvent {
  id: string;
  type:
    | "rate_limit"
    | "invalid_file"
    | "blocked_ip"
    | "malware_detected"
    | "large_file"
    | "access_denied"
    | "suspicious_activity";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  details: {
    ip?: string;
    filename?: string;
    fileSize?: number;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
  };
}

export interface SecurityStats {
  totalEvents: number;
  rateLimits: number;
  invalidFiles: number;
  blockedIPs: number;
  last24h: number;
  malwareDetected: number;
  largeFilesBlocked: number;
}

export interface SecurityHeaderProps {
  title: string;
  description: string;
}

export interface SecurityActionsProps {
  onRefresh: () => void;
  onExport: () => void;
  onClear: () => void;
  isLoading: boolean;
}

export interface SecurityStatsGridProps {
  stats: SecurityStats;
  isLoading: boolean;
}

export interface SecurityEventsListProps {
  events: SecurityEvent[];
  isLoading: boolean;
}

export interface SecurityStatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

// Handler function types
export type SecurityDataHandler = () => Promise<void>;
export type SecurityExportHandler = () => Promise<void>;
export type SecurityClearHandler = () => Promise<void>;

// Utility function types
export type GetSeverityColorFunction = (
  severity: SecurityEvent["severity"]
) => string;
export type GetEventIconFunction = (
  type: SecurityEvent["type"]
) => React.ReactNode;
export type FormatTimestampFunction = (timestamp: Date) => string;
