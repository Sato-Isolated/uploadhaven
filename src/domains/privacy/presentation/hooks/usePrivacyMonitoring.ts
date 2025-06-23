/**
 * 🔐 usePrivacyMonitoring Hook - Privacy Status & Audit Management
 * 
 * React hook for monitoring privacy status and managing audit events.
 * Integrates with the Privacy domain services.
 * 
 * @domain privacy
 * @pattern Presentation Hook (DDD)
 * @privacy zero-knowledge - no sensitive data exposure
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuditService, RawAuditEvent, AuditResult } from '../../infrastructure/logging/audit.service';
import { SecurityEventStats } from '../../domain/repositories/ISecurityEventRepository';

/**
 * Privacy monitoring status
 */
export interface PrivacyStatus {
  readonly isMonitoring: boolean;
  readonly lastAuditEvent?: Date;
  readonly eventsToday: number;
  readonly privacyLevel: 'public' | 'anonymized' | 'hashed';
  readonly complianceStatus: 'compliant' | 'warning' | 'violation';
}

/**
 * Audit event input for logging
 */
export interface AuditEventInput {
  readonly type: string;
  readonly action: string;
  readonly severity?: 'low' | 'medium' | 'high' | 'critical';
  readonly metadata?: Record<string, any>;
}

/**
 * Privacy monitoring hook return type
 */
export interface UsePrivacyMonitoringReturn {
  // Status
  readonly privacyStatus: PrivacyStatus;
  readonly isLoading: boolean;
  readonly error: string | null;

  // Actions
  readonly logEvent: (event: AuditEventInput) => Promise<void>;
  readonly getAuditStats: (timeRange?: { from: Date; to: Date }) => Promise<SecurityEventStats | null>;
  readonly refreshStatus: () => Promise<void>;

  // Helper functions
  readonly logFileUpload: (fileId: string, fileSize: number) => Promise<void>;
  readonly logFileDownload: (fileId: string, success: boolean) => Promise<void>;
  readonly logSecurityEvent: (event: RawAuditEvent) => Promise<void>;
}

/**
 * React hook for privacy monitoring and audit logging
 */
export function usePrivacyMonitoring(
  auditService?: AuditService
): UsePrivacyMonitoringReturn {
  // State
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>({
    isMonitoring: false,
    eventsToday: 0,
    privacyLevel: 'public',
    complianceStatus: 'compliant',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get client IP (privacy-safe way)
   */
  const getClientIP = useCallback(async (): Promise<string> => {
    try {
      // Use a privacy-friendly way to get IP (could be hashed immediately)
      return 'client_ip_hashed'; // In real implementation, get actual IP and hash it
    } catch {
      return 'unknown_ip';
    }
  }, []);

  /**
   * Get user agent hash
   */
  const getUserAgentHash = useCallback((): string => {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      // In real implementation, hash the user agent
      return 'user_agent_hashed';
    }
    return 'unknown_ua';
  }, []);

  /**
   * Log a generic audit event
   */
  const logEvent = useCallback(async (event: AuditEventInput): Promise<void> => {
    if (!auditService) {
      console.warn('AuditService not available for logging');
      return;
    }

    try {
      setError(null);

      const clientIP = await getClientIP();
      const userAgent = getUserAgentHash();

      const auditEvent: RawAuditEvent = {
        type: event.type,
        severity: event.severity || 'low',
        source: 'system', // Default source
        action: event.action,
        context: {
          clientIP,
          userAgent,
        },
        metadata: event.metadata,
      };

      await auditService.logSecurityEvent(auditEvent);

      // Update status
      setPrivacyStatus(prev => ({
        ...prev,
        lastAuditEvent: new Date(),
        eventsToday: prev.eventsToday + 1,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to log audit event: ${errorMessage}`);
      console.error('Audit logging failed:', err);
    }
  }, [auditService, getClientIP, getUserAgentHash]);

  /**
   * Log file upload event
   */
  const logFileUpload = useCallback(async (fileId: string, fileSize: number): Promise<void> => {
    if (!auditService) return;

    try {
      const clientIP = await getClientIP();
      const userAgent = getUserAgentHash();

      await auditService.logFileUpload({
        fileId,
        fileSize,
        clientIP,
        userAgent,
        duration: 0, // Could be measured from upload start
      });

      // Update privacy status
      setPrivacyStatus(prev => ({
        ...prev,
        lastAuditEvent: new Date(),
        eventsToday: prev.eventsToday + 1,
        privacyLevel: 'anonymized', // File uploads are anonymized
      }));

    } catch (err) {
      setError(`Failed to log file upload: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [auditService, getClientIP, getUserAgentHash]);

  /**
   * Log file download event
   */
  const logFileDownload = useCallback(async (fileId: string, success: boolean): Promise<void> => {
    if (!auditService) return;

    try {
      const clientIP = await getClientIP();
      const userAgent = getUserAgentHash();

      await auditService.logFileDownload({
        fileId,
        clientIP,
        userAgent,
        success,
        errorCode: success ? undefined : 'download_failed',
      });

      setPrivacyStatus(prev => ({
        ...prev,
        lastAuditEvent: new Date(),
        eventsToday: prev.eventsToday + 1,
      }));

    } catch (err) {
      setError(`Failed to log file download: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [auditService, getClientIP, getUserAgentHash]);

  /**
   * Log raw security event
   */
  const logSecurityEvent = useCallback(async (event: RawAuditEvent): Promise<void> => {
    if (!auditService) return;

    try {
      await auditService.logSecurityEvent(event);

      setPrivacyStatus(prev => ({
        ...prev,
        lastAuditEvent: new Date(),
        eventsToday: prev.eventsToday + 1,
        privacyLevel: 'hashed', // Security events are hashed
      }));

    } catch (err) {
      setError(`Failed to log security event: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [auditService]);

  /**
   * Get audit statistics
   */
  const getAuditStats = useCallback(async (timeRange?: { from: Date; to: Date }): Promise<SecurityEventStats | null> => {
    if (!auditService) return null;

    try {
      setIsLoading(true);
      setError(null);

      const defaultTimeRange = timeRange || {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        to: new Date(),
      };

      const stats = await auditService.getAuditStatistics(defaultTimeRange);
      return stats;

    } catch (err) {
      setError(`Failed to get audit stats: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [auditService]);

  /**
   * Refresh privacy status
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get today's stats
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const stats = await getAuditStats({ from: startOfDay, to: today });

      setPrivacyStatus(prev => ({
        ...prev,
        isMonitoring: !!auditService,
        eventsToday: stats?.totalEvents || 0,
        complianceStatus: 'compliant', // TODO: Add compliance checking logic
      }));

    } catch (err) {
      setError(`Failed to refresh status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [auditService, getAuditStats]);

  /**
   * Initialize privacy monitoring
   */
  useEffect(() => {
    if (auditService) {
      refreshStatus();
    }
  }, [auditService, refreshStatus]);

  return {
    // Status
    privacyStatus,
    isLoading,
    error,

    // Actions
    logEvent,
    getAuditStats,
    refreshStatus,

    // Helper functions
    logFileUpload,
    logFileDownload,
    logSecurityEvent,
  };
}
