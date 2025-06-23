/**
 * 🔧 Admin Action Entity - Administrative Operations Tracking
 * 
 * Represents administrative actions taken on the platform.
 * Privacy-safe: Contains only action metadata, no user personal data.
 * 
 * @domain admin
 * @pattern Entity (DDD)
 * @privacy zero-knowledge - administrative metadata only
 */

import { Entity } from '../../../../shared/domain/types';
import { AdminActionId } from '../value-objects/AdminActionId.vo';
import { AdminUserId } from '../value-objects/AdminUserId.vo';
import { ActionType } from '../value-objects/ActionType.vo';

export interface AdminActionData {
  readonly id: string;
  readonly adminUserId: string;         // ID of admin who performed action
  readonly actionType: ActionType;
  readonly targetType: 'user' | 'file' | 'system';
  readonly targetId?: string;           // ID of affected entity
  readonly reason?: string;             // Reason for action
  readonly metadata?: Record<string, any>; // Additional context (privacy-safe)
  readonly timestamp: Date;
  readonly ipHash?: string;             // Hashed IP for audit trail
}

/**
 * AdminAction entity for tracking administrative operations
 */
export class AdminAction extends Entity<string> {
  private constructor(
    id: AdminActionId,
    private readonly _adminUserId: AdminUserId,
    private readonly _actionType: ActionType,
    private readonly _targetType: 'user' | 'file' | 'system',
    private readonly _targetId?: string,
    private readonly _reason?: string,
    private readonly _metadata?: Record<string, any>,
    private readonly _timestamp: Date = new Date(),
    private readonly _ipHash?: string
  ) {
    super(id.value);
  }

  // Getter for the properly typed ID
  get actionId(): AdminActionId {
    return AdminActionId.fromString(this._id);
  }

  /**
   * Create new admin action
   */
  static create(
    adminUserId: AdminUserId,
    actionType: ActionType,
    targetType: 'user' | 'file' | 'system',
    options: {
      targetId?: string;
      reason?: string;
      metadata?: Record<string, any>;
      ipAddress?: string; // Will be hashed for privacy
    } = {}
  ): AdminAction {
    const id = AdminActionId.generate();
    const ipHash = options.ipAddress
      ? AdminAction.hashIpAddress(options.ipAddress)
      : undefined;

    return new AdminAction(
      id,
      adminUserId,
      actionType,
      targetType,
      options.targetId,
      options.reason,
      options.metadata,
      new Date(),
      ipHash
    );
  }

  /**
   * Reconstruct from storage data
   */
  static fromData(data: AdminActionData): AdminAction {
    return new AdminAction(
      AdminActionId.fromString(data.id),
      AdminUserId.fromString(data.adminUserId),
      data.actionType,
      data.targetType,
      data.targetId,
      data.reason,
      data.metadata,
      data.timestamp,
      data.ipHash
    );
  }

  // =============================================================================
  // Getters
  // =============================================================================
  get id(): string {
    return this._id;
  }

  get adminUserId(): string {
    return this._adminUserId.value;
  }

  get actionType(): ActionType {
    return this._actionType;
  }

  get targetType(): 'user' | 'file' | 'system' {
    return this._targetType;
  }

  get targetId(): string | undefined {
    return this._targetId;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get ipHash(): string | undefined {
    return this._ipHash;
  }

  // =============================================================================
  // Business Logic
  // =============================================================================

  /**
   * Check if action affects a specific target
   */
  affectsTarget(targetId: string): boolean {
    return this._targetId === targetId;
  }

  /**
   * Check if action was performed by specific admin
   */
  performedBy(adminUserId: string): boolean {
    return this._adminUserId.value === adminUserId;
  }

  /**
   * Get privacy-safe summary for audit logs
   */
  getAuditSummary(): {
    id: string;
    action: string;
    targetType: string;
    targetId?: string;
    timestamp: Date;
    hasReason: boolean;
  } {
    return {
      id: this._id,
      action: this._actionType.value,
      targetType: this._targetType,
      targetId: this._targetId,
      timestamp: this._timestamp,
      hasReason: !!this._reason
    };
  }
  /**
   * Convert to storage format
   */
  toData(): AdminActionData {
    return {
      id: this._id,
      adminUserId: this._adminUserId.value,
      actionType: this._actionType,
      targetType: this._targetType,
      targetId: this._targetId,
      reason: this._reason,
      metadata: this._metadata,
      timestamp: this._timestamp,
      ipHash: this._ipHash
    };
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Hash IP address for privacy-preserving audit trail
   */
  private static hashIpAddress(ipAddress: string): string {
    // Use crypto API to hash IP for privacy
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ipAddress).digest('hex');
  }
}
