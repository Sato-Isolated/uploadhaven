/**
 * 🔧 Admin Action Repository Interface
 * 
 * Defines operations for storing and retrieving administrative actions.
 * Privacy-focused: Only stores action metadata, no personal data.
 * 
 * @domain admin
 * @pattern Repository (DDD)
 * @privacy zero-knowledge - administrative audit trail only
 */

import { AdminAction, AdminActionData } from '../entities/AdminAction.entity';
import { AdminActionId } from '../value-objects/AdminActionId.vo';
import { AdminUserId } from '../value-objects/AdminUserId.vo';
import { ActionType } from '../value-objects/ActionType.vo';

/**
 * Query filters for admin action searches
 */
export interface AdminActionFilters {
  adminUserId?: string;
  actionType?: ActionType;
  targetType?: 'user' | 'file' | 'system';
  targetId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Admin action statistics
 */
export interface AdminActionStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByAdmin: Record<string, number>;
  recentActions: number; // Last 24 hours
}

/**
 * Repository interface for administrative actions
 */
export interface IAdminActionRepository {
  /**
   * Store a new admin action
   */
  save(action: AdminAction): Promise<void>;

  /**
   * Find admin action by ID
   */
  findById(id: AdminActionId): Promise<AdminAction | null>;

  /**
   * Find admin actions with filters
   */
  findByFilters(filters: AdminActionFilters): Promise<AdminAction[]>;

  /**
   * Find actions performed by specific admin
   */
  findByAdminUserId(adminUserId: AdminUserId, limit?: number): Promise<AdminAction[]>;

  /**
   * Find actions affecting specific target
   */
  findByTarget(targetType: 'user' | 'file' | 'system', targetId: string): Promise<AdminAction[]>;

  /**
   * Get recent admin actions (last 24 hours)
   */
  findRecentActions(limit?: number): Promise<AdminAction[]>;

  /**
   * Get admin action statistics
   */
  getStatistics(dateFrom?: Date, dateTo?: Date): Promise<AdminActionStats>;

  /**
   * Count total actions with optional filters
   */
  count(filters?: Partial<AdminActionFilters>): Promise<number>;

  /**
   * Delete old admin actions (for compliance/retention)
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Check if admin has performed specific action recently
   */
  hasRecentAction(
    adminUserId: AdminUserId,
    actionType: ActionType,
    withinMinutes: number
  ): Promise<boolean>;

  /**
   * Get actions requiring follow-up (emergency actions, etc.)
   */
  findActionsPendingFollowUp(): Promise<AdminAction[]>;

  /**
   * Bulk insert admin actions (for data migration/imports)
   */
  bulkSave(actions: AdminAction[]): Promise<void>;

  /**
   * Find actions by date range for audit reports
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<AdminAction[]>;

  /**
   * Get action frequency by type for analytics
   */
  getActionFrequency(actionType: ActionType, days: number): Promise<number>;
}
