/**
 * Comprehensive Audit and Logging Types for UploadHaven
 * Security-first, GDPR-compliant audit system
 */

// =============================================================================
// Core Audit Types
// =============================================================================

/**
 * Audit event categories
 */
export type AuditCategory = 
  | 'user_action'      // User actions (login, upload, download)
  | 'admin_action'     // Admin actions
  | 'security_event'   // Security-related events
  | 'system_event'     // System operations
  | 'data_access'      // Data access and modifications
  | 'file_operation'   // File operations (upload, download, delete)
  | 'auth_event'       // Authentication events
  | 'compliance'       // GDPR and compliance events

/**
 * Audit event severity levels
 */
export type AuditSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Audit event status
 */
export type AuditStatus = 'success' | 'failure' | 'pending' | 'cancelled';

/**
 * Base audit log entry interface
 */
export interface BaseAuditLog {
  readonly id: string;
  readonly category: AuditCategory;
  readonly action: string;
  readonly description: string;
  readonly severity: AuditSeverity;
  readonly status: AuditStatus;
  readonly timestamp: Date;
  readonly ipHash: string; // SHA-256 hashed IP for privacy
  readonly userAgent?: string;
  readonly sessionId?: string;
  readonly createdAt: Date;
  readonly expiresAt: Date; // TTL for auto-cleanup
}

// =============================================================================
// Specific Audit Types
// =============================================================================

/**
 * User action audit log
 */
export interface UserAuditLog extends BaseAuditLog {
  readonly category: 'user_action';
  readonly userId?: string;
  readonly userEmail?: string; // Encrypted in database
  readonly metadata: {
    readonly fileId?: string;
    readonly fileName?: string; // Encrypted in database
    readonly fileSize?: number;
    readonly downloadCount?: number;
    readonly shareUrl?: string;
    readonly expirationSet?: string;
    readonly passwordProtected?: boolean;
    readonly [key: string]: unknown;
  };
}

/**
 * Admin action audit log
 */
export interface AdminAuditLog extends BaseAuditLog {
  readonly category: 'admin_action';
  readonly adminId: string;
  readonly adminEmail: string; // Encrypted in database
  readonly targetUserId?: string;
  readonly targetResource?: string;
  readonly metadata: {
    readonly previousValue?: unknown;
    readonly newValue?: unknown;
    readonly affectedCount?: number;
    readonly bulkOperation?: boolean;
    readonly [key: string]: unknown;
  };
}

/**
 * Security event audit log
 */
export interface SecurityAuditLog extends BaseAuditLog {
  readonly category: 'security_event';
  readonly threatLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly blocked: boolean;
  readonly metadata: {
    readonly threatType?: string;
    readonly ruleTriggered?: string;
    readonly blockedReason?: string;
    readonly malwareSignature?: string;
    readonly suspiciousPattern?: string;
    readonly [key: string]: unknown;
  };
}

/**
 * System event audit log
 */
export interface SystemAuditLog extends BaseAuditLog {
  readonly category: 'system_event';
  readonly service: string;
  readonly component: string;
  readonly metadata: {
    readonly errorCode?: string;
    readonly errorMessage?: string;
    readonly performance?: {
      readonly duration?: number;
      readonly memoryUsage?: number;
      readonly cpuUsage?: number;
    };
    readonly [key: string]: unknown;
  };
}

/**
 * File operation audit log
 */
export interface FileAuditLog extends BaseAuditLog {
  readonly category: 'file_operation';
  readonly fileId: string;
  readonly fileName: string; // Encrypted in database
  readonly fileHash: string; // SHA-256 for integrity
  readonly userId?: string;
  readonly metadata: {
    readonly fileSize: number;
    readonly mimeType: string;
    readonly encrypted: boolean;
    readonly passwordProtected: boolean;
    readonly downloadLimit?: number;
    readonly expiresAt?: Date;
    readonly [key: string]: unknown;
  };
}

/**
 * Authentication event audit log
 */
export interface AuthAuditLog extends BaseAuditLog {
  readonly category: 'auth_event';
  readonly userId?: string;
  readonly email?: string; // Encrypted in database
  readonly authMethod: 'password' | 'oauth' | 'session' | 'api_key';
  readonly metadata: {
    readonly provider?: string;
    readonly mfaUsed?: boolean;
    readonly failureReason?: string;
    readonly attemptCount?: number;
    readonly lockoutTriggered?: boolean;
    readonly [key: string]: unknown;
  };
}

/**
 * Data access audit log
 */
export interface DataAccessAuditLog extends BaseAuditLog {
  readonly category: 'data_access';
  readonly resourceType: 'file' | 'user' | 'admin' | 'system';
  readonly resourceId: string;
  readonly accessType: 'read' | 'write' | 'delete' | 'export';
  readonly userId?: string;
  readonly metadata: {
    readonly dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
    readonly exportFormat?: string;
    readonly recordCount?: number;
    readonly [key: string]: unknown;
  };
}

/**
 * Compliance audit log
 */
export interface ComplianceAuditLog extends BaseAuditLog {
  readonly category: 'compliance';
  readonly regulation: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'internal';
  readonly complianceAction: 'data_export' | 'data_deletion' | 'consent_given' | 'consent_withdrawn' | 'data_breach';
  readonly userId?: string;
  readonly metadata: {
    readonly legalBasis?: string;
    readonly dataCategories?: string[];
    readonly retentionPeriod?: number;
    readonly breachNotified?: boolean;
    readonly [key: string]: unknown;
  };
}

// =============================================================================
// Union Types and Discriminated Unions
// =============================================================================

/**
 * All possible audit log types
 */
export type AuditLog = 
  | UserAuditLog
  | AdminAuditLog
  | SecurityAuditLog
  | SystemAuditLog
  | FileAuditLog
  | AuthAuditLog
  | DataAccessAuditLog
  | ComplianceAuditLog;

// =============================================================================
// Query and Response Types
// =============================================================================

/**
 * Audit log query filters
 */
export interface AuditLogFilters {
  readonly category?: AuditCategory | AuditCategory[];
  readonly severity?: AuditSeverity | AuditSeverity[];
  readonly status?: AuditStatus | AuditStatus[];
  readonly userId?: string;
  readonly adminId?: string;
  readonly ipHash?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly action?: string;
  readonly fileId?: string;
  readonly search?: string; // Full-text search
  readonly threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  readonly blocked?: boolean;
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: 'timestamp' | 'severity' | 'category';
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Audit log query response
 */
export interface AuditLogQueryResponse {
  readonly logs: AuditLog[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
  readonly aggregations?: {
    readonly bySeverity: Record<AuditSeverity, number>;
    readonly byCategory: Record<AuditCategory, number>;
    readonly byStatus: Record<AuditStatus, number>;
    readonly byHour: Array<{ hour: string; count: number }>;
  };
}

/**
 * Audit statistics
 */
export interface AuditStats {
  readonly totalLogs: number;
  readonly last24Hours: number;
  readonly last7Days: number;
  readonly last30Days: number;
  readonly bySeverity: Record<AuditSeverity, number>;
  readonly byCategory: Record<AuditCategory, number>;
  readonly topActions: Array<{ action: string; count: number }>;
  readonly securityEvents: {
    readonly total: number;
    readonly blocked: number;
    readonly critical: number;
    readonly last24h: number;
  };
  readonly systemHealth: {
    readonly errorRate: number;
    readonly avgResponseTime: number;
    readonly uptimePercentage: number;
  };
}

// =============================================================================
// Export Types
// =============================================================================

/**
 * Audit log export formats
 */
export type AuditExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

/**
 * Audit log export options
 */
export interface AuditExportOptions {
  readonly format: AuditExportFormat;
  readonly filters: AuditLogFilters;
  readonly includeMetadata: boolean;
  readonly includeEncrypted: boolean; // For admins only
  readonly passwordProtected?: boolean;
  readonly password?: string;
}

/**
 * Audit log export result
 */
export interface AuditExportResult {
  readonly success: boolean;
  readonly downloadUrl?: string;
  readonly fileName: string;
  readonly size: number;
  readonly recordCount: number;
  readonly expiresAt: Date;
  readonly error?: string;
}

// =============================================================================
// Real-time Types
// =============================================================================

/**
 * Real-time audit event
 */
export interface RealtimeAuditEvent {
  readonly type: 'audit_log_created';
  readonly data: AuditLog;
  readonly timestamp: Date;
}

/**
 * Audit alert configuration
 */
export interface AuditAlert {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly conditions: {
    readonly category?: AuditCategory[];
    readonly severity?: AuditSeverity[];
    readonly action?: string[];
    readonly threshold?: {
      readonly count: number;
      readonly timeWindow: number; // in minutes
    };
  };
  readonly notifications: {
    readonly email?: string[];
    readonly webhook?: string;
    readonly inApp?: boolean;
  };
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// =============================================================================
// Admin Interface Types
// =============================================================================

/**
 * Audit dashboard configuration
 */
export interface AuditDashboardConfig {
  readonly widgets: Array<{
    readonly id: string;
    readonly type: 'chart' | 'table' | 'metric' | 'timeline';
    readonly title: string;
    readonly query: AuditLogFilters;
    readonly position: { x: number; y: number; width: number; height: number };
    readonly refreshInterval: number; // in seconds
  }>;
  readonly defaultTimeRange: '1h' | '24h' | '7d' | '30d';
  readonly autoRefresh: boolean;
}

/**
 * Audit retention policy
 */
export interface AuditRetentionPolicy {
  readonly category: AuditCategory;
  readonly retentionDays: number;
  readonly autoArchive: boolean;
  readonly archiveLocation?: 's3' | 'glacier' | 'local';
  readonly encryptArchive: boolean;
}
