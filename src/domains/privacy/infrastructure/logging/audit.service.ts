/**
 * 🔐 Audit Service - Privacy-First Security Event Logging
 * 
 * Implements privacy-compliant audit logging for UploadHaven.
 * Zero-knowledge principles: No sensitive data stored, only anonymized events.
 * 
 * @domain privacy
 * @pattern Service (DDD)
 * @privacy zero-knowledge - no sensitive data logged
 */

import { SecurityEvent } from '../../domain/entities/SecurityEvent.entity';
import { ISecurityEventRepository, SecurityEventStats } from '../../domain/repositories/ISecurityEventRepository';
import { IPrivacySanitizer } from '../../domain/services/IPrivacySanitizer';
import { EventType } from '../../domain/value-objects/EventType.vo';
import { PrivacyLevel } from '../../domain/value-objects/PrivacyLevel.vo';
import { AnonymizedIdentifier } from '../../domain/value-objects/AnonymizedIdentifier.vo';

/**
 * Raw audit event input (before sanitization)
 */
export interface RawAuditEvent {
  readonly type: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly source: 'api' | 'upload' | 'download' | 'auth' | 'system';
  readonly action: string;
  readonly context?: {
    readonly clientIP?: string;
    readonly userAgent?: string;
    readonly sessionId?: string;
    readonly userId?: string;
    readonly fileId?: string;
    // ❌ NO: file contents, encryption keys, passwords, personal data
  };
  readonly metadata?: {
    readonly fileSize?: number;
    readonly requestDuration?: number;
    readonly errorCode?: string;
    readonly rateLimit?: number;
  };
}

/**
 * Audit logging result
 */
export interface AuditResult {
  readonly eventId: string;
  readonly timestamp: Date;
  readonly privacyLevel: PrivacyLevel;
  readonly sanitized: boolean;
}

/**
 * Privacy-first audit service implementation
 */
export class AuditService {
  constructor(
    private readonly securityEventRepository: ISecurityEventRepository,
    private readonly privacySanitizer: IPrivacySanitizer
  ) { }

  /**
   * Log a security event with privacy protection
   * 
   * @param rawEvent - Raw event data (will be sanitized)
   * @returns Promise<AuditResult>
   */
  async logSecurityEvent(rawEvent: RawAuditEvent): Promise<AuditResult> {
    try {
      // 1. Sanitize sensitive data
      const sanitizedContext = await this.privacySanitizer.sanitizeContext({
        source: rawEvent.source,
        action: rawEvent.action,
        ipHash: rawEvent.context?.clientIP ?
          await this.hashSensitiveData(rawEvent.context.clientIP) : undefined,
        userAgentHash: rawEvent.context?.userAgent ?
          await this.hashSensitiveData(rawEvent.context.userAgent) : undefined,
        sessionHash: rawEvent.context?.sessionId ?
          await this.hashSensitiveData(rawEvent.context.sessionId) : undefined,
      });

      // 2. Create privacy-safe metadata
      const sanitizedMetadata = rawEvent.metadata ? {
        fileSize: rawEvent.metadata.fileSize,
        requestDuration: rawEvent.metadata.requestDuration,
        errorCode: rawEvent.metadata.errorCode,
        rateLimit: rawEvent.metadata.rateLimit,
      } : undefined;      // 3. Create anonymized identifier based on context
      const anonymizedId = rawEvent.context?.userId
        ? await AnonymizedIdentifier.fromUser(rawEvent.context.userId)
        : rawEvent.context?.sessionId
          ? await AnonymizedIdentifier.fromSession(rawEvent.context.sessionId)
          : AnonymizedIdentifier.generate('generic');

      // 4. Create security event (simplified for now)
      const securityEvent = SecurityEvent.createAnonymous(
        EventType.fromString(rawEvent.type),
        rawEvent.severity,
        sanitizedContext
      );

      // 5. Store the sanitized event
      await this.securityEventRepository.save(securityEvent); return {
        eventId: securityEvent.id,
        timestamp: securityEvent.timestamp,
        privacyLevel: PrivacyLevel.anonymized(),
        sanitized: true,
      };

    } catch (error) {
      // 6. Log error without exposing sensitive data
      console.error('Audit logging failed:', {
        type: rawEvent.type,
        source: rawEvent.source,
        action: rawEvent.action,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      throw new Error('Failed to log security event');
    }
  }

  /**
   * Log file upload event (anonymous)
   */
  async logFileUpload(context: {
    fileId: string;
    fileSize: number;
    clientIP: string;
    userAgent?: string;
    duration?: number;
  }): Promise<AuditResult> {
    return this.logSecurityEvent({
      type: 'file_upload',
      severity: 'low',
      source: 'upload',
      action: 'anonymous_upload',
      context: {
        clientIP: context.clientIP,
        userAgent: context.userAgent,
        fileId: context.fileId, // Public file ID, no sensitive data
      },
      metadata: {
        fileSize: context.fileSize,
        requestDuration: context.duration,
      },
    });
  }

  /**
   * Log file download event
   */
  async logFileDownload(context: {
    fileId: string;
    clientIP: string;
    userAgent?: string;
    success: boolean;
    errorCode?: string;
  }): Promise<AuditResult> {
    return this.logSecurityEvent({
      type: 'file_download',
      severity: context.success ? 'low' : 'medium',
      source: 'download',
      action: context.success ? 'download_success' : 'download_failed',
      context: {
        clientIP: context.clientIP,
        userAgent: context.userAgent,
        fileId: context.fileId,
      },
      metadata: {
        errorCode: context.errorCode,
      },
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(context: {
    action: 'login' | 'logout' | 'register' | 'password_reset';
    success: boolean;
    clientIP: string;
    userAgent?: string;
    userId?: string;
    errorCode?: string;
  }): Promise<AuditResult> {
    return this.logSecurityEvent({
      type: 'authentication',
      severity: context.success ? 'low' : 'medium',
      source: 'auth',
      action: context.action,
      context: {
        clientIP: context.clientIP,
        userAgent: context.userAgent,
        userId: context.userId, // Will be hashed by sanitizer
      },
      metadata: {
        errorCode: context.errorCode,
      },
    });
  }

  /**
   * Log rate limiting event
   */
  async logRateLimit(context: {
    clientIP: string;
    endpoint: string;
    limit: number;
    window: number;
  }): Promise<AuditResult> {
    return this.logSecurityEvent({
      type: 'rate_limit',
      severity: 'medium',
      source: 'api',
      action: 'rate_limit_exceeded',
      context: {
        clientIP: context.clientIP,
      },
      metadata: {
        rateLimit: context.limit,
      },
    });
  }

  /**
   * Log system error (privacy-safe)
   */
  async logSystemError(context: {
    component: string;
    action: string;
    errorCode: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<AuditResult> {
    return this.logSecurityEvent({
      type: 'system_error',
      severity: context.severity,
      source: 'system',
      action: context.action,
      metadata: {
        errorCode: context.errorCode,
      },
    });
  }
  /**
   * Get audit statistics (privacy-safe aggregates)
   */
  async getAuditStatistics(timeWindow: {
    from: Date;
    to: Date;
  }): Promise<SecurityEventStats> {
    return this.securityEventRepository.getStats(timeWindow);
  }

  /**
   * Hash sensitive data for privacy protection
   * 
   * @private
   */
  private async hashSensitiveData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
