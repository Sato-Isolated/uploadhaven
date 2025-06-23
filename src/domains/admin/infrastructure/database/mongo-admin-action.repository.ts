/**
 * 🔧 MongoDB Admin Action Repository
 * 
 * MongoDB implementation of admin action repository.
 * Privacy-compliant: Stores only action metadata, no personal data.
 * 
 * @domain admin
 * @pattern Repository Implementation (DDD)
 * @privacy zero-knowledge - administrative audit trail only
 */

import { Collection, MongoClient, Db } from 'mongodb';
import { AdminAction, AdminActionData } from '../../domain/entities/AdminAction.entity';
import { AdminActionId } from '../../domain/value-objects/AdminActionId.vo';
import { AdminUserId } from '../../domain/value-objects/AdminUserId.vo';
import { ActionType } from '../../domain/value-objects/ActionType.vo';
import {
  IAdminActionRepository,
  AdminActionFilters,
  AdminActionStats
} from '../../domain/repositories/IAdminActionRepository';

/**
 * MongoDB document interface for admin actions
 */
interface AdminActionDocument extends AdminActionData {
  _id?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB implementation of admin action repository
 */
export class MongoAdminActionRepository implements IAdminActionRepository {
  private readonly collection: Collection<AdminActionDocument>;

  constructor(
    private readonly db: Db,
    collectionName: string = 'adminActions'
  ) {
    this.collection = db.collection<AdminActionDocument>(collectionName);
    this.setupIndexes();
  }

  /**
   * Save admin action to database
   */
  async save(action: AdminAction): Promise<void> {
    const data = action.toData();
    const document: AdminActionDocument = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.collection.insertOne(document);
  }

  /**
   * Find admin action by ID
   */
  async findById(id: AdminActionId): Promise<AdminAction | null> {
    const document = await this.collection.findOne({ id: id.value });
    return document ? AdminAction.fromData(document) : null;
  }

  /**
   * Find admin actions with filters
   */
  async findByFilters(filters: AdminActionFilters): Promise<AdminAction[]> {
    const query = this.buildFilterQuery(filters);
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const documents = await this.collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return documents.map(doc => AdminAction.fromData(doc));
  }

  /**
   * Find actions performed by specific admin
   */
  async findByAdminUserId(adminUserId: AdminUserId, limit: number = 50): Promise<AdminAction[]> {
    const documents = await this.collection
      .find({ adminUserId: adminUserId.value })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return documents.map(doc => AdminAction.fromData(doc));
  }

  /**
   * Find actions affecting specific target
   */
  async findByTarget(targetType: 'user' | 'file' | 'system', targetId: string): Promise<AdminAction[]> {
    const documents = await this.collection
      .find({ targetType, targetId })
      .sort({ timestamp: -1 })
      .toArray();

    return documents.map(doc => AdminAction.fromData(doc));
  }

  /**
   * Get recent admin actions (last 24 hours)
   */
  async findRecentActions(limit: number = 100): Promise<AdminAction[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const documents = await this.collection
      .find({ timestamp: { $gte: yesterday } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return documents.map(doc => AdminAction.fromData(doc));
  }

  /**
   * Get admin action statistics
   */
  async getStatistics(dateFrom?: Date, dateTo?: Date): Promise<AdminActionStats> {
    const dateFilter: any = {};
    if (dateFrom) dateFilter.$gte = dateFrom;
    if (dateTo) dateFilter.$lte = dateTo;

    const pipeline = [
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { timestamp: dateFilter } }] : []),
      {
        $group: {
          _id: null,
          totalActions: { $sum: 1 },
          actionsByType: {
            $addToSet: {
              type: { $toString: '$actionType.value' },
              count: 1
            }
          },
          actionsByAdmin: {
            $addToSet: {
              admin: '$adminUserId',
              count: 1
            }
          }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    const stats = result[0] || { totalActions: 0, actionsByType: [], actionsByAdmin: [] };

    // Count recent actions (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActions = await this.collection.countDocuments({
      timestamp: { $gte: yesterday }
    });

    // Process action counts
    const actionsByType: Record<string, number> = {};
    const actionsByAdmin: Record<string, number> = {};

    // Count actions by type
    const typeAggregation = await this.collection.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { timestamp: dateFilter } }] : []),
      { $group: { _id: { $toString: '$actionType.value' }, count: { $sum: 1 } } }
    ]).toArray();

    typeAggregation.forEach(item => {
      actionsByType[item._id] = item.count;
    });

    // Count actions by admin
    const adminAggregation = await this.collection.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { timestamp: dateFilter } }] : []),
      { $group: { _id: '$adminUserId', count: { $sum: 1 } } }
    ]).toArray();

    adminAggregation.forEach(item => {
      actionsByAdmin[item._id] = item.count;
    });

    return {
      totalActions: stats.totalActions,
      actionsByType,
      actionsByAdmin,
      recentActions
    };
  }

  /**
   * Count total actions with optional filters
   */
  async count(filters?: Partial<AdminActionFilters>): Promise<number> {
    const query = filters ? this.buildFilterQuery(filters) : {};
    return await this.collection.countDocuments(query);
  }

  /**
   * Delete old admin actions (for compliance/retention)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.collection.deleteMany({
      timestamp: { $lt: date }
    });
    return result.deletedCount || 0;
  }

  /**
   * Check if admin has performed specific action recently
   */
  async hasRecentAction(
    adminUserId: AdminUserId,
    actionType: ActionType,
    withinMinutes: number
  ): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);

    const count = await this.collection.countDocuments({
      adminUserId: adminUserId.value,
      'actionType.value': actionType.value,
      timestamp: { $gte: cutoffTime }
    });

    return count > 0;
  }

  /**
   * Get actions requiring follow-up (emergency actions, etc.)
   */
  async findActionsPendingFollowUp(): Promise<AdminAction[]> {
    // Emergency actions that might need follow-up
    const emergencyTypes = [
      'emergency_shutdown',
      'emergency_lockdown',
      'security_incident_report'
    ];

    const documents = await this.collection
      .find({
        'actionType.value': { $in: emergencyTypes },
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
      .sort({ timestamp: -1 })
      .toArray();

    return documents.map(doc => AdminAction.fromData(doc));
  }

  /**
   * Bulk insert admin actions (for data migration/imports)
   */
  async bulkSave(actions: AdminAction[]): Promise<void> {
    if (actions.length === 0) return;

    const documents: AdminActionDocument[] = actions.map(action => ({
      ...action.toData(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await this.collection.insertMany(documents);
  }

  /**
   * Find actions by date range for audit reports
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<AdminAction[]> {
    const documents = await this.collection
      .find({
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ timestamp: -1 })
      .toArray();

    return documents.map(doc => AdminAction.fromData(doc));
  }

  /**
   * Get action frequency by type for analytics
   */
  async getActionFrequency(actionType: ActionType, days: number): Promise<number> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await this.collection.countDocuments({
      'actionType.value': actionType.value,
      timestamp: { $gte: startDate }
    });
  }

  /**
   * Build MongoDB query from filters
   */
  private buildFilterQuery(filters: Partial<AdminActionFilters>): any {
    const query: any = {};

    if (filters.adminUserId) {
      query.adminUserId = filters.adminUserId;
    }

    if (filters.actionType) {
      query['actionType.value'] = filters.actionType.value;
    }

    if (filters.targetType) {
      query.targetType = filters.targetType;
    }

    if (filters.targetId) {
      query.targetId = filters.targetId;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {};
      if (filters.dateFrom) query.timestamp.$gte = filters.dateFrom;
      if (filters.dateTo) query.timestamp.$lte = filters.dateTo;
    }

    return query;
  }

  /**
   * Setup database indexes for performance
   */
  private async setupIndexes(): Promise<void> {
    try {
      // Index on admin user ID for fast admin action lookup
      await this.collection.createIndex({ adminUserId: 1 });

      // Index on action type for filtering
      await this.collection.createIndex({ 'actionType.value': 1 });

      // Index on target for fast target-based queries
      await this.collection.createIndex({ targetType: 1, targetId: 1 });

      // Index on timestamp for recent actions and date range queries
      await this.collection.createIndex({ timestamp: -1 });

      // Compound index for recent action checks
      await this.collection.createIndex({
        adminUserId: 1,
        'actionType.value': 1,
        timestamp: -1
      });

      // TTL index for automatic cleanup (optional - 1 year retention)
      await this.collection.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: 365 * 24 * 60 * 60 } // 1 year
      );
    } catch (error) {
      console.warn('Could not create admin action indexes:', error);
    }
  }
}
