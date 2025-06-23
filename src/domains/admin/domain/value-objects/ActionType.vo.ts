/**
 * 🔧 Action Type Value Object
 * 
 * Represents the type of administrative action performed.
 * Provides a controlled vocabulary for admin operations.
 * 
 * @domain admin
 * @pattern Value Object (DDD)
 * @privacy safe - contains only action type classifications
 */

import { ValueObject } from '../../../../shared/domain/types';

// Valid action types for administrative operations
export const ADMIN_ACTION_TYPES = {
  // File Management Actions
  FILE_DELETE: 'file_delete',
  FILE_RESTORE: 'file_restore',
  FILE_QUARANTINE: 'file_quarantine',
  FILE_BULK_DELETE: 'file_bulk_delete',

  // User Management Actions
  USER_SUSPEND: 'user_suspend',
  USER_ACTIVATE: 'user_activate',
  USER_DELETE: 'user_delete',
  USER_RESET_PASSWORD: 'user_reset_password',
  USER_GRANT_ADMIN: 'user_grant_admin',
  USER_REVOKE_ADMIN: 'user_revoke_admin',

  // System Administration
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore',
  SYSTEM_CONFIG_UPDATE: 'system_config_update',
  SYSTEM_SECURITY_SCAN: 'system_security_scan',

  // Audit and Monitoring
  AUDIT_LOG_EXPORT: 'audit_log_export',
  AUDIT_LOG_PURGE: 'audit_log_purge',
  SECURITY_INCIDENT_REPORT: 'security_incident_report',
  ABUSE_REPORT_REVIEW: 'abuse_report_review',

  // Privacy and Compliance
  GDPR_DATA_EXPORT: 'gdpr_data_export',
  GDPR_DATA_DELETE: 'gdpr_data_delete',
  PRIVACY_POLICY_UPDATE: 'privacy_policy_update',
  TERMS_UPDATE: 'terms_update',

  // Emergency Actions
  EMERGENCY_SHUTDOWN: 'emergency_shutdown',
  EMERGENCY_LOCKDOWN: 'emergency_lockdown',
  EMERGENCY_UNLOCK: 'emergency_unlock'
} as const;

export type AdminActionTypeValue = typeof ADMIN_ACTION_TYPES[keyof typeof ADMIN_ACTION_TYPES];

/**
 * ActionType value object for admin action classification
 */
export class ActionType extends ValueObject {
  private constructor(private readonly _value: AdminActionTypeValue) {
    super();
    this.validateActionType(_value);
  }

  /**
   * Create from predefined action type
   */
  static fromString(value: string): ActionType {
    return new ActionType(value as AdminActionTypeValue);
  }

  // Factory methods for common action types
  static fileDelete(): ActionType {
    return new ActionType(ADMIN_ACTION_TYPES.FILE_DELETE);
  }

  static userSuspend(): ActionType {
    return new ActionType(ADMIN_ACTION_TYPES.USER_SUSPEND);
  }

  static systemMaintenance(): ActionType {
    return new ActionType(ADMIN_ACTION_TYPES.SYSTEM_MAINTENANCE);
  }

  static auditLogExport(): ActionType {
    return new ActionType(ADMIN_ACTION_TYPES.AUDIT_LOG_EXPORT);
  }

  static gdprDataDelete(): ActionType {
    return new ActionType(ADMIN_ACTION_TYPES.GDPR_DATA_DELETE);
  }

  static emergencyShutdown(): ActionType {
    return new ActionType(ADMIN_ACTION_TYPES.EMERGENCY_SHUTDOWN);
  }

  /**
   * Get string value
   */
  get value(): AdminActionTypeValue {
    return this._value;
  }

  /**
   * Check if this type equals another type
   */
  equals(other: ValueObject): boolean {
    return other instanceof ActionType && this._value === other._value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * Check if this is a file-related action
   */
  isFileAction(): boolean {
    return this._value.startsWith('file_');
  }

  /**
   * Check if this is a user-related action
   */
  isUserAction(): boolean {
    return this._value.startsWith('user_');
  }

  /**
   * Check if this is a system-related action
   */
  isSystemAction(): boolean {
    return this._value.startsWith('system_');
  }

  /**
   * Check if this is an emergency action
   */
  isEmergencyAction(): boolean {
    return this._value.startsWith('emergency_');
  }

  /**
   * Check if this is a privacy/compliance action
   */
  isPrivacyAction(): boolean {
    return this._value.startsWith('gdpr_') || this._value.includes('privacy') || this._value.includes('terms');
  }

  /**
   * Get human-readable description
   */
  getDescription(): string {
    const descriptions: Record<AdminActionTypeValue, string> = {
      [ADMIN_ACTION_TYPES.FILE_DELETE]: 'Delete file from system',
      [ADMIN_ACTION_TYPES.FILE_RESTORE]: 'Restore deleted file',
      [ADMIN_ACTION_TYPES.FILE_QUARANTINE]: 'Quarantine suspicious file',
      [ADMIN_ACTION_TYPES.FILE_BULK_DELETE]: 'Bulk delete multiple files',
      [ADMIN_ACTION_TYPES.USER_SUSPEND]: 'Suspend user account',
      [ADMIN_ACTION_TYPES.USER_ACTIVATE]: 'Activate user account',
      [ADMIN_ACTION_TYPES.USER_DELETE]: 'Delete user account',
      [ADMIN_ACTION_TYPES.USER_RESET_PASSWORD]: 'Reset user password',
      [ADMIN_ACTION_TYPES.USER_GRANT_ADMIN]: 'Grant admin privileges',
      [ADMIN_ACTION_TYPES.USER_REVOKE_ADMIN]: 'Revoke admin privileges',
      [ADMIN_ACTION_TYPES.SYSTEM_MAINTENANCE]: 'System maintenance operation',
      [ADMIN_ACTION_TYPES.SYSTEM_BACKUP]: 'Create system backup',
      [ADMIN_ACTION_TYPES.SYSTEM_RESTORE]: 'Restore from backup',
      [ADMIN_ACTION_TYPES.SYSTEM_CONFIG_UPDATE]: 'Update system configuration',
      [ADMIN_ACTION_TYPES.SYSTEM_SECURITY_SCAN]: 'Run security scan',
      [ADMIN_ACTION_TYPES.AUDIT_LOG_EXPORT]: 'Export audit logs',
      [ADMIN_ACTION_TYPES.AUDIT_LOG_PURGE]: 'Purge old audit logs',
      [ADMIN_ACTION_TYPES.SECURITY_INCIDENT_REPORT]: 'Report security incident',
      [ADMIN_ACTION_TYPES.ABUSE_REPORT_REVIEW]: 'Review abuse report',
      [ADMIN_ACTION_TYPES.GDPR_DATA_EXPORT]: 'GDPR data export request',
      [ADMIN_ACTION_TYPES.GDPR_DATA_DELETE]: 'GDPR data deletion request',
      [ADMIN_ACTION_TYPES.PRIVACY_POLICY_UPDATE]: 'Update privacy policy',
      [ADMIN_ACTION_TYPES.TERMS_UPDATE]: 'Update terms of service',
      [ADMIN_ACTION_TYPES.EMERGENCY_SHUTDOWN]: 'Emergency system shutdown',
      [ADMIN_ACTION_TYPES.EMERGENCY_LOCKDOWN]: 'Emergency system lockdown',
      [ADMIN_ACTION_TYPES.EMERGENCY_UNLOCK]: 'Emergency system unlock'
    };

    return descriptions[this._value] || 'Unknown admin action';
  }

  /**
   * Validate action type
   */
  private validateActionType(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('ActionType must be a non-empty string');
    }

    const validTypes = Object.values(ADMIN_ACTION_TYPES);
    if (!validTypes.includes(value as AdminActionTypeValue)) {
      throw new Error(`Invalid action type: ${value}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Get all valid action types
   */
  static getAllTypes(): AdminActionTypeValue[] {
    return Object.values(ADMIN_ACTION_TYPES);
  }

  /**
   * Get validation rules for this value object
   */
  static getValidationRules() {
    return {
      required: true,
      type: 'string',
      enum: Object.values(ADMIN_ACTION_TYPES),
      description: 'Type of administrative action performed'
    };
  }
}
