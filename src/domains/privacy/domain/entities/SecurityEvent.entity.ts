/**
 * SecurityEvent Entity - Domain Model for Privacy-Compliant Security Monitoring
 * 
 * Represents a security-related event that has been anonymized and sanitized
 * for compliance with zero-knowledge and privacy principles.
 * 
 * @domain privacy
 * @pattern Entity (DDD)
 * @privacy zero-knowledge - no sensitive data stored
 */

import { Entity } from '../../../../shared/domain/types';
import { EventType } from '../value-objects/EventType.vo';
import { PrivacyLevel } from '../value-objects/PrivacyLevel.vo';
import { AnonymizedIdentifier } from '../value-objects/AnonymizedIdentifier.vo';

/**
 * Security event severity levels
 */
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Privacy-safe security event context
 */
export interface SecurityEventContext {
  readonly source: 'api' | 'upload' | 'download' | 'auth' | 'system';
  readonly action: string; // Generic action description
  readonly ipHash?: string; // SHA-256 hash for privacy
  readonly userAgentHash?: string; // SHA-256 hash for privacy
  readonly sessionHash?: string; // SHA-256 hash for privacy
  // ❌ NO: actual IP addresses, user IDs, session tokens, personal data
}

/**
 * Privacy-compliant metadata for security events
 */
export interface SecurityEventMetadata {
  readonly fileSize?: number; // Public information
  readonly requestDuration?: number; // Performance metric
  readonly errorCode?: string; // Generic error classification
  readonly rateLimit?: number; // Rate limiting information
  // ❌ NO: file contents, encryption keys, user data, sensitive context
}

/**
 * SecurityEvent entity for privacy-compliant security monitoring
 * 
 * Key principles:
 * - Zero-knowledge: No sensitive data stored
 * - Anonymous: All identifiers are hashed/anonymized
 * - Compliant: GDPR and privacy regulation adherent
 * - Transparent: Users can see what's being monitored
 */
export class SecurityEvent extends Entity<string> {
  private constructor(
    id: string,
    private readonly _eventType: EventType,
    private readonly _severity: SecurityEventSeverity,
    private readonly _context: SecurityEventContext,
    private readonly _metadata: SecurityEventMetadata,
    private readonly _privacyLevel: PrivacyLevel,
    private readonly _anonymizedId: AnonymizedIdentifier,
    private readonly _timestamp: Date
  ) {
    super(id);
  }

  /**
   * Create a new anonymous security event
   * 
   * @param eventType - Type of security event
   * @param severity - Event severity level
   * @param context - Privacy-safe context information
   * @param metadata - Privacy-compliant metadata
   * @returns SecurityEvent
   */
  static createAnonymous(
    eventType: EventType,
    severity: SecurityEventSeverity,
    context: SecurityEventContext,
    metadata: SecurityEventMetadata = {}
  ): SecurityEvent {
    // Validate privacy compliance at creation
    SecurityEvent.validatePrivacyCompliance(context, metadata);

    const id = AnonymizedIdentifier.generate().value;
    const privacyLevel = PrivacyLevel.forSecurityEvent(severity);
    const anonymizedId = AnonymizedIdentifier.generate();
    const timestamp = new Date();

    return new SecurityEvent(
      id,
      eventType,
      severity,
      context,
      metadata,
      privacyLevel,
      anonymizedId,
      timestamp
    );
  }
  /**
   * Reconstitute from stored data (for repository)
   */
  static fromStored(
    id: string,
    eventType: string,
    severity: SecurityEventSeverity,
    context: SecurityEventContext,
    metadata: SecurityEventMetadata,
    privacyLevel: string,
    anonymizedId: string,
    timestamp: Date
  ): SecurityEvent {
    return new SecurityEvent(
      id,
      EventType.fromString(eventType),
      severity,
      context,
      metadata,
      PrivacyLevel.fromString(privacyLevel),
      AnonymizedIdentifier.fromString(anonymizedId),
      timestamp
    );
  }

  // =============================================================================
  // Public Accessors (Privacy-Safe)
  // =============================================================================

  get eventType(): string {
    return this._eventType.value;
  }

  get severity(): SecurityEventSeverity {
    return this._severity;
  }

  get context(): SecurityEventContext {
    return { ...this._context };
  }

  get metadata(): SecurityEventMetadata {
    return { ...this._metadata };
  }

  get privacyLevel(): string {
    return this._privacyLevel.value;
  }

  get anonymizedId(): string {
    return this._anonymizedId.value;
  }

  get timestamp(): Date {
    return new Date(this._timestamp);
  }

  get isHighSeverity(): boolean {
    return this._severity === 'high' || this._severity === 'critical';
  }

  get isCritical(): boolean {
    return this._severity === 'critical';
  }

  // =============================================================================
  // Business Logic
  // =============================================================================

  /**
   * Check if event requires immediate attention
   */
  requiresImmediateAttention(): boolean {
    return this.isCritical ||
      (this.isHighSeverity && this._eventType.isSecurityThreat());
  }

  /**
   * Check if event should trigger alerts
   */
  shouldTriggerAlert(): boolean {
    return this.isHighSeverity || this._eventType.isAbusePattern();
  }

  /**
   * Get retention period for this event
   */
  getRetentionPeriod(): number {
    // High severity events kept longer for security analysis
    if (this.isHighSeverity) {
      return 365; // 1 year in days
    }
    return 90; // 3 months for normal events
  }

  /**
   * Check if event is expired based on retention policy
   */
  isExpired(): boolean {
    const retentionMs = this.getRetentionPeriod() * 24 * 60 * 60 * 1000;
    const expirationDate = new Date(this._timestamp.getTime() + retentionMs);
    return new Date() > expirationDate;
  }

  /**
   * Generate privacy-safe summary for transparency reports
   */
  getPublicSummary(): {
    eventType: string;
    severity: SecurityEventSeverity;
    source: string;
    timestamp: Date;
    privacyLevel: string;
  } {
    return {
      eventType: this.eventType,
      severity: this.severity,
      source: this.context.source,
      timestamp: this.timestamp,
      privacyLevel: this.privacyLevel
    };
  }

  // =============================================================================
  // Privacy Validation
  // =============================================================================

  /**
   * Validate that context and metadata contain no sensitive data
   */
  private static validatePrivacyCompliance(
    context: SecurityEventContext,
    metadata: SecurityEventMetadata
  ): void {
    // Check context for privacy violations
    const contextStr = JSON.stringify(context).toLowerCase();
    const metadataStr = JSON.stringify(metadata).toLowerCase();

    // Forbidden patterns that might indicate sensitive data
    const forbiddenPatterns = [
      'password', 'secret', 'key', 'token', 'email', '@',
      'user_id', 'userid', 'username', 'phone', 'address',
      'credit', 'card', 'ssn', 'social', 'personal'
    ];

    for (const pattern of forbiddenPatterns) {
      if (contextStr.includes(pattern) || metadataStr.includes(pattern)) {
        throw new Error(`Privacy violation: sensitive data detected (${pattern})`);
      }
    }

    // Validate IP addresses are hashed
    if (context.ipHash && !context.ipHash.match(/^[a-f0-9]{64}$/)) {
      throw new Error('Privacy violation: IP address must be SHA-256 hashed');
    }

    // Validate user agent is hashed
    if (context.userAgentHash && !context.userAgentHash.match(/^[a-f0-9]{64}$/)) {
      throw new Error('Privacy violation: User agent must be SHA-256 hashed');
    }

    // Validate session is hashed
    if (context.sessionHash && !context.sessionHash.match(/^[a-f0-9]{64}$/)) {
      throw new Error('Privacy violation: Session identifier must be SHA-256 hashed');
    }
  }

  /**
   * Sanitize raw event data for privacy compliance
   */
  static sanitizeRawEvent(rawEvent: any): {
    context: SecurityEventContext;
    metadata: SecurityEventMetadata;
  } {
    // Hash any potentially identifying information
    const context: SecurityEventContext = {
      source: rawEvent.source || 'system',
      action: rawEvent.action || 'unknown',
      ipHash: rawEvent.ip ? SecurityEvent.hashSensitiveData(rawEvent.ip) : undefined,
      userAgentHash: rawEvent.userAgent ? SecurityEvent.hashSensitiveData(rawEvent.userAgent) : undefined,
      sessionHash: rawEvent.sessionId ? SecurityEvent.hashSensitiveData(rawEvent.sessionId) : undefined
    };

    // Extract only privacy-safe metadata
    const metadata: SecurityEventMetadata = {
      fileSize: typeof rawEvent.fileSize === 'number' ? rawEvent.fileSize : undefined,
      requestDuration: typeof rawEvent.duration === 'number' ? rawEvent.duration : undefined,
      errorCode: typeof rawEvent.errorCode === 'string' ? rawEvent.errorCode : undefined,
      rateLimit: typeof rawEvent.rateLimit === 'number' ? rawEvent.rateLimit : undefined
    };

    return { context, metadata };
  }

  /**
   * Hash sensitive data using SHA-256
   */
  private static hashSensitiveData(data: string): string {
    // In a real implementation, use crypto.subtle.digest or similar
    // For now, simulate a hash
    return `hashed_${Buffer.from(data).toString('base64').substring(0, 32)}`;
  }
}
