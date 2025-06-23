/**
 * EventType Value Object - Privacy-Compliant Security Event Classification
 * 
 * Represents the type of security event being logged.
 * Provides privacy-safe categorization without exposing sensitive information.
 * 
 * @domain privacy
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - no sensitive data in event types
 */

import { ValueObject } from '../../../../shared/domain/types';

/**
 * Supported security event types
 */
export type SecurityEventTypeValue =
  // File Operations (anonymous)
  | 'file.upload.success'
  | 'file.upload.failed'
  | 'file.download.success'
  | 'file.download.failed'
  | 'file.download.limit_exceeded'
  | 'file.expired'
  | 'file.deleted'

  // Authentication Events (optional accounts)
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.logout'
  | 'auth.session.expired'
  | 'auth.password.changed'
  | 'auth.account.created'
  | 'auth.account.deleted'

  // API Security Events
  | 'api.rate_limit.exceeded'
  | 'api.invalid_request'
  | 'api.unauthorized_access'
  | 'api.malformed_payload'
  | 'api.encryption.failed'
  | 'api.validation.failed'

  // System Security Events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.health_check'
  | 'system.database.connection_lost'
  | 'system.database.connection_restored'
  | 'system.performance.degraded'
  | 'system.error.critical'

  // Security Threats (anonymized)
  | 'security.brute_force.detected'
  | 'security.suspicious_activity'
  | 'security.malware.suspected'
  | 'security.ddos.detected'
  | 'security.injection.attempted'
  | 'security.xss.attempted'

  // Privacy & Compliance
  | 'privacy.data_request.received'
  | 'privacy.data_request.fulfilled'
  | 'privacy.data_deletion.requested'
  | 'privacy.data_deletion.completed'
  | 'privacy.audit.started'
  | 'privacy.audit.completed'

  // Administrative Actions
  | 'admin.user.action'
  | 'admin.file.moderated'
  | 'admin.system.maintenance'
  | 'admin.config.changed'

  // Generic/Unknown
  | 'unknown.event';

/**
 * EventType value object for security event classification
 * 
 * Provides privacy-safe event categorization with methods to determine
 * event characteristics without exposing sensitive information.
 */
export class EventType extends ValueObject {
  private constructor(private readonly _value: SecurityEventTypeValue) {
    super();
  }

  /**
   * Get the event type value
   */
  get value(): SecurityEventTypeValue {
    return this._value;
  }

  /**
   * Create EventType from string
   */
  static fromString(value: string): EventType {
    if (!EventType.isValidEventType(value)) {
      throw new Error(`Invalid event type: ${value}`);
    }
    return new EventType(value as SecurityEventTypeValue);
  }

  /**
   * Create EventType for file operations
   */
  static fileUploadSuccess(): EventType {
    return new EventType('file.upload.success');
  }

  static fileUploadFailed(): EventType {
    return new EventType('file.upload.failed');
  }

  static fileDownloadSuccess(): EventType {
    return new EventType('file.download.success');
  }

  static fileDownloadFailed(): EventType {
    return new EventType('file.download.failed');
  }

  static fileDownloadLimitExceeded(): EventType {
    return new EventType('file.download.limit_exceeded');
  }

  /**
   * Create EventType for API security events
   */
  static apiRateLimitExceeded(): EventType {
    return new EventType('api.rate_limit.exceeded');
  }

  static apiUnauthorizedAccess(): EventType {
    return new EventType('api.unauthorized_access');
  }

  static apiEncryptionFailed(): EventType {
    return new EventType('api.encryption.failed');
  }

  /**
   * Create EventType for security threats
   */
  static securityBruteForceDetected(): EventType {
    return new EventType('security.brute_force.detected');
  }

  static securitySuspiciousActivity(): EventType {
    return new EventType('security.suspicious_activity');
  }

  static securityDdosDetected(): EventType {
    return new EventType('security.ddos.detected');
  }

  /**
   * Create EventType for system events
   */
  static systemStartup(): EventType {
    return new EventType('system.startup');
  }

  static systemCriticalError(): EventType {
    return new EventType('system.error.critical');
  }

  static systemHealthCheck(): EventType {
    return new EventType('system.health_check');
  }

  // =============================================================================
  // Event Classification Methods
  // =============================================================================

  /**
   * Check if event type represents a security threat
   */
  isSecurityThreat(): boolean {
    return this.value.startsWith('security.') ||
      this.value === 'api.unauthorized_access' ||
      this.value === 'auth.login.failed';
  }

  /**
   * Check if event type represents an abuse pattern
   */
  isAbusePattern(): boolean {
    return this.value === 'api.rate_limit.exceeded' ||
      this.value === 'file.download.limit_exceeded' ||
      this.value === 'security.brute_force.detected' ||
      this.value === 'security.ddos.detected';
  }

  /**
   * Check if event type is related to file operations
   */
  isFileOperation(): boolean {
    return this.value.startsWith('file.');
  }

  /**
   * Check if event type is related to authentication
   */
  isAuthenticationEvent(): boolean {
    return this.value.startsWith('auth.');
  }

  /**
   * Check if event type is system-related
   */
  isSystemEvent(): boolean {
    return this.value.startsWith('system.');
  }

  /**
   * Check if event type requires immediate attention
   */
  requiresImmediateAttention(): boolean {
    return this.isSecurityThreat() ||
      this.value === 'system.error.critical' ||
      this.value === 'system.database.connection_lost';
  }

  /**
   * Get the category of the event
   */
  getCategory(): 'file' | 'auth' | 'api' | 'system' | 'security' | 'privacy' | 'admin' | 'unknown' {
    if (this.value.startsWith('file.')) return 'file';
    if (this.value.startsWith('auth.')) return 'auth';
    if (this.value.startsWith('api.')) return 'api';
    if (this.value.startsWith('system.')) return 'system';
    if (this.value.startsWith('security.')) return 'security';
    if (this.value.startsWith('privacy.')) return 'privacy';
    if (this.value.startsWith('admin.')) return 'admin';
    return 'unknown';
  }

  /**
   * Get suggested severity level for this event type
   */
  getSuggestedSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    // Critical events
    if (this.value === 'system.error.critical' ||
      this.value === 'security.ddos.detected' ||
      this.value === 'system.database.connection_lost') {
      return 'critical';
    }

    // High severity events
    if (this.isSecurityThreat() ||
      this.value === 'api.unauthorized_access' ||
      this.value === 'security.brute_force.detected') {
      return 'high';
    }

    // Medium severity events
    if (this.isAbusePattern() ||
      this.value === 'api.encryption.failed' ||
      this.value === 'auth.login.failed') {
      return 'medium';
    }

    // Low severity events (normal operations)
    return 'low';
  }

  // =============================================================================
  // Validation
  // =============================================================================

  /**
   * Validate if a string is a valid event type
   */
  private static isValidEventType(value: string): value is SecurityEventTypeValue {
    const validEventTypes: SecurityEventTypeValue[] = [
      // File Operations
      'file.upload.success', 'file.upload.failed', 'file.download.success',
      'file.download.failed', 'file.download.limit_exceeded', 'file.expired', 'file.deleted',

      // Authentication
      'auth.login.success', 'auth.login.failed', 'auth.logout', 'auth.session.expired',
      'auth.password.changed', 'auth.account.created', 'auth.account.deleted',

      // API Security
      'api.rate_limit.exceeded', 'api.invalid_request', 'api.unauthorized_access',
      'api.malformed_payload', 'api.encryption.failed', 'api.validation.failed',

      // System
      'system.startup', 'system.shutdown', 'system.health_check',
      'system.database.connection_lost', 'system.database.connection_restored',
      'system.performance.degraded', 'system.error.critical',

      // Security Threats
      'security.brute_force.detected', 'security.suspicious_activity',
      'security.malware.suspected', 'security.ddos.detected',
      'security.injection.attempted', 'security.xss.attempted',

      // Privacy & Compliance
      'privacy.data_request.received', 'privacy.data_request.fulfilled',
      'privacy.data_deletion.requested', 'privacy.data_deletion.completed',
      'privacy.audit.started', 'privacy.audit.completed',

      // Administrative
      'admin.user.action', 'admin.file.moderated', 'admin.system.maintenance', 'admin.config.changed',

      // Generic
      'unknown.event'
    ];

    return validEventTypes.includes(value as SecurityEventTypeValue);
  }
  /**
   * Get all valid event types
   */
  static getAllEventTypes(): SecurityEventTypeValue[] {
    return [
      'file.upload.success', 'file.upload.failed', 'file.download.success',
      'file.download.failed', 'file.download.limit_exceeded', 'file.expired', 'file.deleted',
      'auth.login.success', 'auth.login.failed', 'auth.logout', 'auth.session.expired',
      'auth.password.changed', 'auth.account.created', 'auth.account.deleted',
      'api.rate_limit.exceeded', 'api.invalid_request', 'api.unauthorized_access',
      'api.malformed_payload', 'api.encryption.failed', 'api.validation.failed',
      'system.startup', 'system.shutdown', 'system.health_check',
      'system.database.connection_lost', 'system.database.connection_restored',
      'system.performance.degraded', 'system.error.critical',
      'security.brute_force.detected', 'security.suspicious_activity',
      'security.malware.suspected', 'security.ddos.detected',
      'security.injection.attempted', 'security.xss.attempted',
      'privacy.data_request.received', 'privacy.data_request.fulfilled',
      'privacy.data_deletion.requested', 'privacy.data_deletion.completed',
      'privacy.audit.started', 'privacy.audit.completed',
      'admin.user.action', 'admin.file.moderated', 'admin.system.maintenance', 'admin.config.changed',
      'unknown.event'
    ];
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof EventType && obj._value === this._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }
}
