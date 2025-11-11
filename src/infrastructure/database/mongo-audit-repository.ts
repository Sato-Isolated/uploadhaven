import { Db, Collection } from 'mongodb';
import { AuditRepository, AuditLogFilters } from '@/domains/audit/audit-repository';
import { AuditLogEntity } from '@/domains/audit/audit-entity';
import { logger } from '@/lib/logger';

export class MongoAuditRepository implements AuditRepository {
  private collection: Collection;

  constructor(private db: Db) {
    this.collection = db.collection('audit_logs');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      // Index for user queries
      await this.collection.createIndex({ userId: 1, createdAt: -1 });
      
      // Index for action queries
      await this.collection.createIndex({ action: 1, createdAt: -1 });
      
      // Index for automatic cleanup of expired logs
      await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      // Index for date queries
      await this.collection.createIndex({ createdAt: -1 });
      
      logger.info('Audit logs indexes created successfully');
    } catch (error) {
      logger.error('Failed to create audit logs indexes', { error });
    }
  }

  async save(auditLog: AuditLogEntity): Promise<void> {
    try {
      const doc = {
        id: auditLog.id,
        createdAt: auditLog.createdAt,
        expiresAt: auditLog.expiresAt,
        action: auditLog.action,
        userId: auditLog.userId,
        targetId: auditLog.targetId,
        ipHash: auditLog.ipHash,
        userAgent: auditLog.userAgent,
        metadata: auditLog.metadata,
        severity: auditLog.severity,
      };

      await this.collection.insertOne(doc);
    } catch (error) {
      logger.error('Failed to save audit log', { error, auditLogId: auditLog.id });
      throw error;
    }
  }

  async findById(id: string): Promise<AuditLogEntity | null> {
    try {
      const doc = await this.collection.findOne({ id });
      return doc ? this.mapToEntity(doc) : null;
    } catch (error) {
      logger.error('Failed to find audit log by id', { error, id });
      throw error;
    }
  }

  async findAll(): Promise<AuditLogEntity[]> {
    try {
      const docs = await this.collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000) // Limite pour éviter les gros résultats
        .toArray();
      
      return docs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Failed to find all audit logs', { error });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<AuditLogEntity[]> {
    try {
      const docs = await this.collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return docs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Failed to find audit logs by user id', { error, userId });
      throw error;
    }
  }

  async findByFilters(filters: AuditLogFilters, limit: number = 100): Promise<AuditLogEntity[]> {
    try {
      const query: any = {};

      if (filters.userId) {
        query.userId = filters.userId;
      }

      if (filters.action) {
        query.action = filters.action;
      }

      if (filters.severity) {
        query.severity = filters.severity;
      }

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.createdAt.$lte = filters.endDate;
        }
      }

      const docs = await this.collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return docs.map(doc => this.mapToEntity(doc));
    } catch (error) {
      logger.error('Failed to find audit logs by filters', { error, filters });
      throw error;
    }
  }

  async deleteExpiredLogs(): Promise<number> {
    try {
      const result = await this.collection.deleteMany({
        expiresAt: { $lte: new Date() }
      });
      
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Failed to delete expired audit logs', { error });
      throw error;
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      return await this.collection.countDocuments({ userId });
    } catch (error) {
      logger.error('Failed to count audit logs by user id', { error, userId });
      throw error;
    }
  }

  async deleteByUserId(userId: string): Promise<number> {
    try {
      const result = await this.collection.deleteMany({ userId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Failed to delete audit logs by user id', { error, userId });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.collection.deleteOne({ id });
    } catch (error) {
      logger.error('Failed to delete audit log', { error, id });
      throw error;
    }
  }

  async cleanup(): Promise<number> {
    return this.deleteExpiredLogs();
  }

  async update(auditLog: AuditLogEntity): Promise<void> {
    // Les logs d'audit ne doivent pas être modifiés pour l'intégrité
    throw new Error('Audit logs cannot be updated');
  }

  private mapToEntity(doc: any): AuditLogEntity {
    return new AuditLogEntity(
      {
        action: doc.action,
        userId: doc.userId,
        targetId: doc.targetId,
        ipHash: doc.ipHash,
        userAgent: doc.userAgent,
        metadata: doc.metadata,
        severity: doc.severity,
      },
      doc.id,
      doc.createdAt,
      doc.expiresAt
    );
  }
}
