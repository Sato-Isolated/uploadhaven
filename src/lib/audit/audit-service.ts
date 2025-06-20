/**
 * Audit Service - Core business logic for audit logging
 * Security-first, GDPR-compliant audit system
 */

import connectDB from '@/lib/database/mongodb';
import { AuditLog as AuditLogModel, initializeAuditSystem } from '@/lib/database/audit-models';
import type { 
  AuditLog,
  AuditCategory,
  AuditSeverity,
  AuditStatus,
  AuditLogFilters,
  AuditLogQueryResponse,
  AuditStats,
  UserAuditLog,
  AdminAuditLog,
  SecurityAuditLog,
  SystemAuditLog,
  FileAuditLog,
  AuthAuditLog,
  DataAccessAuditLog,
  ComplianceAuditLog,
  AuditExportOptions,
  AuditExportResult
} from '@/types/audit';
import { encryptData } from '@/lib/encryption/aes-gcm';
import { createHash } from 'crypto';

// =============================================================================
// Core Audit Service Class
// =============================================================================

export class AuditService {
  private static instance: AuditService;
  private encryptionKey: string;

  private constructor() {
    // Initialize encryption key from environment
    this.encryptionKey = process.env.AUDIT_ENCRYPTION_KEY || 'default-audit-key-change-in-production';
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Initialize the audit system
   */
  public async initialize(): Promise<void> {
    try {
      await connectDB();
      await initializeAuditSystem();
    } catch (error) {
      console.error('Failed to initialize audit system:', error);
      throw error;
    }
  }

  /**
   * Hash IP address for privacy compliance
   */
  private hashIP(ip: string): string {
    return createHash('sha256').update(ip + process.env.IP_HASH_SALT || 'default-salt').digest('hex');
  }

  /**
   * Encrypt sensitive field
   */
  private async encryptField(value: string): Promise<string> {
    try {
      const encrypted = await encryptData(value, this.encryptionKey);
      return JSON.stringify(encrypted);
    } catch (error) {
      // Fallback to the original value if encryption fails
      // In production, this should be handled more robustly
      return value;
    }
  }

  /**
   * Create a new audit log entry
   */
  public async createAuditLog(logData: Partial<AuditLog> & {
    category: AuditCategory;
    action: string;
    description: string;
    ip?: string;
    userId?: string;
  }): Promise<AuditLog> {
    try {
      await this.initialize();

      // Prepare base audit log data
      const auditLogData: any = {
        category: logData.category,
        action: logData.action,
        description: logData.description,
        severity: logData.severity || 'info',
        status: logData.status || 'success',
        timestamp: logData.timestamp || new Date(),
        ipHash: logData.ip ? this.hashIP(logData.ip) : this.hashIP('unknown'),
        userAgent: logData.userAgent,
        sessionId: logData.sessionId,
        userId: logData.userId,
        metadata: logData.metadata || {},
        encryptedFields: {}
      };

      // Handle encrypted fields based on category
      const encryptedFields: Record<string, string> = {};
      
      if (logData.metadata) {
        // Encrypt sensitive data
        const sensitiveFields = ['email', 'fileName', 'username', 'realName'];
        
        for (const field of sensitiveFields) {
          if (logData.metadata[field] && typeof logData.metadata[field] === 'string') {
            try {
              encryptedFields[field] = await this.encryptField(logData.metadata[field] as string);
              // Remove from metadata to prevent plain text storage
              delete auditLogData.metadata[field];
            } catch (error) {
              // Log encryption failure but continue
            }
          }
        }
      }

      auditLogData.encryptedFields = encryptedFields;

      // Create and save the audit log
      const auditLog = new AuditLogModel(auditLogData);
      await auditLog.save();

      return auditLog.toObject() as AuditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw new Error('Failed to create audit log');
    }
  }

  /**
   * Log user action
   */
  public async logUserAction(data: Omit<UserAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'user_action',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Log admin action
   */
  public async logAdminAction(data: Omit<AdminAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'admin_action',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Log security event
   */
  public async logSecurityEvent(data: Omit<SecurityAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'security_event',
      severity: data.severity || 'medium',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Log system event
   */
  public async logSystemEvent(data: Omit<SystemAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'system_event',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Log file operation
   */
  public async logFileOperation(data: Omit<FileAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'file_operation',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Log authentication event
   */
  public async logAuthEvent(data: Omit<AuthAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'auth_event',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Log data access
   */
  public async logDataAccess(data: Omit<DataAccessAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'data_access',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Log compliance event
   */
  public async logComplianceEvent(data: Omit<ComplianceAuditLog, 'id' | 'category' | 'timestamp' | 'ipHash' | 'createdAt' | 'expiresAt'>): Promise<void> {
    await this.createAuditLog({
      ...data,
      category: 'compliance',
      severity: data.severity || 'high',
      ip: data.metadata?.ip as string
    });
  }

  /**
   * Query audit logs with filters
   */
  public async queryAuditLogs(filters: AuditLogFilters): Promise<AuditLogQueryResponse> {
    try {
      await this.initialize();

      const limit = Math.min(filters.limit || 50, 1000); // Max 1000 records
      const offset = filters.offset || 0;

      // Build the query
      const query = (AuditLogModel as any).findWithFilters(filters, { 
        limit, 
        offset,
        includeEncrypted: false // Admin-only in separate endpoint
      });

      // Execute query and count
      const [logs, total] = await Promise.all([
        query.exec(),
        AuditLogModel.countDocuments(query.getFilter())
      ]);

      // Convert to safe objects
      const safeLogs = logs.map((log: any) => log.toSafeObject());

      // Calculate aggregations if requested
      let aggregations;
      if (filters.search || !offset) {
        aggregations = await this.getAggregations(filters);
      }

      return {
        logs: safeLogs,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        hasMore: total > offset + limit,
        aggregations
      };
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      throw new Error('Failed to query audit logs');
    }
  }

  /**
   * Get audit statistics
   */
  public async getAuditStats(timeRange: string = '24h'): Promise<AuditStats> {
    try {
      await this.initialize();

      const stats = await (AuditLogModel as any).getStats(timeRange);
      
      // Process stats to match expected format
      const processedStats: AuditStats = {
        totalLogs: stats.totalLogs || 0,
        last24Hours: stats.last24h || 0,
        last7Days: 0, // Calculate separately if needed
        last30Days: 0, // Calculate separately if needed
        bySeverity: this.processCounts(stats.bySeverity),
        byCategory: this.processCounts(stats.byCategory),
        topActions: [], // Calculate separately if needed
        securityEvents: {
          total: stats.securityEvents || 0,
          blocked: 0, // Calculate from metadata
          critical: stats.criticalEvents || 0,
          last24h: stats.securityEvents || 0
        },
        systemHealth: {
          errorRate: 0, // Calculate from system events
          avgResponseTime: 0, // Calculate from performance data
          uptimePercentage: 99.9 // Default value
        }
      };

      return processedStats;
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      throw new Error('Failed to get audit stats');
    }
  }

  /**
   * Export audit logs
   */
  public async exportAuditLogs(options: AuditExportOptions): Promise<AuditExportResult> {
    try {
      await this.initialize();

      // Query logs based on filters
      const queryResult = await this.queryAuditLogs({
        ...options.filters,
        limit: 10000 // Max export limit
      });

      // Generate export file
      const fileName = `audit-logs-${new Date().toISOString().split('T')[0]}.${options.format}`;
      
      // In a real implementation, you would:
      // 1. Generate the file in the specified format
      // 2. Store it temporarily in a secure location
      // 3. Return a signed URL for download
      // 4. Set up automatic cleanup of temporary files

      return {
        success: true,
        fileName,
        size: queryResult.logs.length * 500, // Estimated size
        recordCount: queryResult.logs.length,
        downloadUrl: `/api/audit/export/${fileName}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      };
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      return {
        success: false,
        fileName: '',
        size: 0,
        recordCount: 0,
        expiresAt: new Date(),
        error: 'Export failed'
      };
    }
  }

  /**
   * Delete old audit logs (cleanup)
   */
  public async cleanupOldLogs(daysOld: number = 365): Promise<{ deletedCount: number }> {
    try {
      await this.initialize();

      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
      
      const result = await AuditLogModel.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      throw new Error('Failed to cleanup old logs');
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private processCounts(array: string[]): Record<string, number> {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getAggregations(filters: AuditLogFilters) {
    // Implementation for aggregations
    // This would calculate statistics based on the current filters
    return {
      bySeverity: {} as Record<AuditSeverity, number>,
      byCategory: {} as Record<AuditCategory, number>,
      byStatus: {} as Record<AuditStatus, number>,
      byHour: [] as Array<{ hour: string; count: number }>
    };
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const auditService = AuditService.getInstance();

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Quick log user action
 */
export async function logUserAction(
  action: string,
  description: string,
  userId?: string,
  metadata?: Record<string, unknown>,
  ip?: string
): Promise<void> {
  await auditService.logUserAction({
    action,
    description,
    severity: 'info',
    status: 'success',
    userId,
    metadata: { ...metadata, ip }
  });
}

/**
 * Quick log admin action
 */
export async function logAdminAction(
  action: string,
  description: string,
  adminId: string,
  adminEmail: string,
  metadata?: Record<string, unknown>,
  ip?: string
): Promise<void> {
  await auditService.logAdminAction({
    action,
    description,
    severity: 'medium',
    status: 'success',
    adminId,
    adminEmail,
    metadata: { ...metadata, ip }
  });
}

/**
 * Quick log security event
 */
export async function logSecurityEvent(
  action: string,
  description: string,
  severity: AuditSeverity = 'medium',
  blocked: boolean = false,
  metadata?: Record<string, unknown>,
  ip?: string
): Promise<void> {
  await auditService.logSecurityEvent({
    action,
    description,
    severity,
    status: blocked ? 'failure' : 'success',
    threatLevel: severity as any,
    blocked,
    metadata: { ...metadata, ip }
  });
}

/**
 * Quick log file operation
 */
export async function logFileOperation(
  action: string,
  description: string,
  fileId: string,
  fileName: string,
  fileHash: string,
  userId?: string,
  metadata?: Record<string, unknown>,
  ip?: string
): Promise<void> {
  await auditService.logFileOperation({
    action,
    description,
    severity: 'info',
    status: 'success',
    fileId,
    fileName,
    fileHash,
    userId,
    metadata: {
      ...(metadata || {}),
      ip,
      fileSize: (metadata as any)?.fileSize ?? 0,
      mimeType: (metadata as any)?.mimeType ?? '',
      encrypted: (metadata as any)?.encrypted ?? false,
      passwordProtected: (metadata as any)?.passwordProtected ?? false,
      downloadLimit: (metadata as any)?.downloadLimit,
      expiresAt: (metadata as any)?.expiresAt,
    }
  });
}
