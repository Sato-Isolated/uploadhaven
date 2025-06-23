/**
 * 🔐 AccountStatus Value Object - User Account State Management
 * 
 * Represents the current status of a user account.
 * Privacy-safe: Contains no personal information, only status.
 * 
 * @domain user-management
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - status information only
 */

import { ValueObject } from '../../../../shared/domain/types';

export type AccountStatusValue =
  | 'active'
  | 'pending_verification'
  | 'suspended'
  | 'deleted';

export interface AccountStatusData {
  readonly status: AccountStatusValue;
  readonly reason?: string;        // Optional reason for suspension/deletion
  readonly statusChangedAt: Date;
}

/**
 * AccountStatus value object for user account state
 */
export class AccountStatus extends ValueObject implements AccountStatusData {
  private constructor(
    public readonly status: AccountStatusValue,
    public readonly reason: string | undefined,
    public readonly statusChangedAt: Date
  ) {
    super();
    this.validateAccountStatus();
  }

  /**
   * Create active account status
   */
  static active(): AccountStatus {
    return new AccountStatus('active', undefined, new Date());
  }

  /**
   * Create pending verification status
   */
  static pendingVerification(): AccountStatus {
    return new AccountStatus('pending_verification', undefined, new Date());
  }

  /**
   * Create suspended account status
   */
  static suspended(reason?: string): AccountStatus {
    return new AccountStatus('suspended', reason, new Date());
  }

  /**
   * Create deleted account status
   */
  static deleted(reason?: string): AccountStatus {
    return new AccountStatus('deleted', reason, new Date());
  }

  /**
   * Create from stored data
   */
  static fromData(data: AccountStatusData): AccountStatus {
    return new AccountStatus(data.status, data.reason, data.statusChangedAt);
  }

  /**
   * Check if account is active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if account is pending verification
   */
  isPendingVerification(): boolean {
    return this.status === 'pending_verification';
  }

  /**
   * Check if account is suspended
   */
  isSuspended(): boolean {
    return this.status === 'suspended';
  }

  /**
   * Check if account is deleted
   */
  isDeleted(): boolean {
    return this.status === 'deleted';
  }

  /**
   * Check if account can be used
   */
  canAccess(): boolean {
    return this.isActive();
  }

  /**
   * Check if account needs verification
   */
  needsVerification(): boolean {
    return this.isPendingVerification();
  }

  /**
   * Update status with new value
   */
  updateStatus(newStatus: AccountStatusValue, reason?: string): AccountStatus {
    return new AccountStatus(newStatus, reason, new Date());
  }

  /**
   * Get display string for status
   */
  getDisplayString(): string {
    switch (this.status) {
      case 'active':
        return 'Active';
      case 'pending_verification':
        return 'Pending Email Verification';
      case 'suspended':
        return `Suspended${this.reason ? `: ${this.reason}` : ''}`;
      case 'deleted':
        return 'Deleted';
      default:
        return 'Unknown';
    }
  }

  /**
   * Validate account status
   */
  private validateAccountStatus(): void {
    const validStatuses: AccountStatusValue[] = [
      'active',
      'pending_verification',
      'suspended',
      'deleted'
    ];

    if (!validStatuses.includes(this.status)) {
      throw new Error(`Invalid account status: ${this.status}`);
    }

    if (this.reason && typeof this.reason !== 'string') {
      throw new Error('Account status reason must be a string');
    }

    if (!(this.statusChangedAt instanceof Date)) {
      throw new Error('Account status changed date must be a Date object');
    }
  }

  /**
   * Convert to storage format
   */
  toData(): AccountStatusData {
    return {
      status: this.status,
      reason: this.reason,
      statusChangedAt: this.statusChangedAt
    };
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof AccountStatus &&
      obj.status === this.status &&
      obj.reason === this.reason &&
      obj.statusChangedAt.getTime() === this.statusChangedAt.getTime();
  }

  /**
   * String representation
   */
  toString(): string {
    return this.getDisplayString();
  }
}
