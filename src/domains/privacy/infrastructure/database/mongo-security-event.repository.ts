/**
 * 🔐 MongoDB Security Event Repository - Privacy-Compliant Event Storage
 * 
 * MongoDB implementation of the SecurityEventRepository interface.
 * Ensures privacy compliance with proper indexing and TTL.
 * 
 * @domain privacy
 * @pattern Repository Implementation (DDD)
 * @privacy zero-knowledge - no sensitive data storage
 */

import { Collection, MongoClient, ObjectId } from 'mongodb';
import { SecurityEvent } from '../../domain/entities/SecurityEvent.entity';
import { EventType } from '../../domain/value-objects/EventType.vo';
import {
  ISecurityEventRepository,
  SecurityEventQuery,
  SecurityEventStats
} from '../../domain/repositories/ISecurityEventRepository';

/**
 * MongoDB document structure for SecurityEvent
 */
interface SecurityEventDocument {
  readonly _id: ObjectId;
  readonly eventId: string;
  readonly eventType: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly source: 'api' | 'upload' | 'download' | 'auth' | 'system';
  readonly action: string;
  readonly context: {
    readonly ipHash?: string;
    readonly userAgentHash?: string;
    readonly sessionHash?: string;
  };
  readonly metadata: {
    readonly fileSize?: number;
    readonly requestDuration?: number;
    readonly errorCode?: string;
    readonly rateLimit?: number;
  };
  readonly timestamp: Date;
  readonly expiresAt: Date; // TTL for automatic deletion
  readonly privacyLevel: string;
  readonly anonymizedId: string;
}

/**
 * MongoDB implementation of SecurityEvent repository
 */
export class MongoSecurityEventRepository implements ISecurityEventRepository {
  private readonly collectionName = 'security_events';

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly databaseName: string = 'uploadhaven'
  ) { }

  /**
   * Get the security events collection with proper setup
   */
  private async getCollection(): Promise<Collection<SecurityEventDocument>> {
    const db = this.mongoClient.db(this.databaseName);
    const collection = db.collection<SecurityEventDocument>(this.collectionName);

    // Ensure indexes exist for privacy-compliant querying
    await this.ensureIndexes(collection);

    return collection;
  }
  /**
   * Save a security event with privacy compliance
   */
  async save(event: SecurityEvent): Promise<void> {
    const collection = await this.getCollection();

    // Calculate TTL expiration (e.g., 90 days for audit logs)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days retention

    const document: SecurityEventDocument = {
      _id: new ObjectId(),
      eventId: event.id,
      eventType: event.eventType,
      severity: event.severity,
      source: event.context.source,
      action: event.context.action,
      context: {
        ipHash: event.context.ipHash,
        userAgentHash: event.context.userAgentHash,
        sessionHash: event.context.sessionHash,
      },
      metadata: {
        fileSize: event.metadata?.fileSize,
        requestDuration: event.metadata?.requestDuration,
        errorCode: event.metadata?.errorCode,
        rateLimit: event.metadata?.rateLimit,
      },
      timestamp: event.timestamp,
      expiresAt: expiresAt,
      privacyLevel: event.privacyLevel,
      anonymizedId: event.anonymizedId,
    };

    await collection.insertOne(document);
  }

  /**
   * Find security events by ID
   */
  async findById(id: string): Promise<SecurityEvent | null> {
    const collection = await this.getCollection();
    const document = await collection.findOne({ eventId: id });

    if (!document) {
      return null;
    }

    return this.mapDocumentToEntity(document);
  }
  /**
   * Query security events with privacy-safe filtering
   */
  async query(params: SecurityEventQuery): Promise<SecurityEvent[]> {
    const collection = await this.getCollection();

    const filter = this.buildQueryFilter(params);
    const options = {
      sort: { timestamp: -1 as const },
      limit: params.limit || 100,
      skip: params.offset || 0,
    };

    const documents = await collection.find(filter, options).toArray();
    return documents.map(doc => this.mapDocumentToEntity(doc));
  }

  /**
   * Count events matching query (for pagination)
   */
  async count(params: Omit<SecurityEventQuery, 'limit' | 'offset'>): Promise<number> {
    const collection = await this.getCollection();
    const filter = this.buildQueryFilter(params);
    return await collection.countDocuments(filter);
  }

  /**
   * Get aggregated statistics (privacy-safe)
   */
  async getStats(timeRange: { from: Date; to: Date }): Promise<SecurityEventStats> {
    const collection = await this.getCollection();

    const filter = {
      timestamp: {
        $gte: timeRange.from,
        $lte: timeRange.to,
      },
    };

    // Aggregate by event type
    const typeStats = await collection.aggregate([
      { $match: filter },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]).toArray();

    // Aggregate by severity
    const severityStats = await collection.aggregate([
      { $match: filter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]).toArray();

    // Total events
    const totalEvents = await collection.countDocuments(filter);

    // Calculate events per hour
    const hoursDiff = (timeRange.to.getTime() - timeRange.from.getTime()) / (1000 * 60 * 60);
    const eventsPerHour = hoursDiff > 0 ? totalEvents / hoursDiff : 0;

    // Build result
    const eventsByType: Record<string, number> = {};
    typeStats.forEach(stat => {
      eventsByType[stat._id] = stat.count;
    });

    const eventsBySeverity: Record<string, number> = {};
    severityStats.forEach(stat => {
      eventsBySeverity[stat._id] = stat.count;
    });

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      eventsPerHour,
      timeRange,
    };
  }

  /**
   * Delete old events (privacy compliance - data retention)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany({
      timestamp: { $lt: date },
    });
    return result.deletedCount || 0;
  }

  /**
   * Bulk delete events by query (for GDPR compliance)
   */
  async deleteByQuery(params: SecurityEventQuery): Promise<number> {
    const collection = await this.getCollection();
    const filter = this.buildQueryFilter(params);
    const result = await collection.deleteMany(filter);
    return result.deletedCount || 0;
  }

  /**
   * Build MongoDB query filter from SecurityEventQuery
   * 
   * @private
   */
  private buildQueryFilter(params: Omit<SecurityEventQuery, 'limit' | 'offset'>): Record<string, any> {
    const filter: Record<string, any> = {};

    if (params.eventType) {
      filter.eventType = params.eventType.toString();
    }

    if (params.severity) {
      filter.severity = params.severity;
    }

    if (params.source) {
      filter.source = params.source;
    }

    if (params.fromDate || params.toDate) {
      filter.timestamp = {};
      if (params.fromDate) {
        filter.timestamp.$gte = params.fromDate;
      }
      if (params.toDate) {
        filter.timestamp.$lte = params.toDate;
      }
    }

    return filter;
  }
  /**
   * Map MongoDB document to SecurityEvent entity
   * 
   * @private
   */
  private mapDocumentToEntity(document: SecurityEventDocument): SecurityEvent {
    // Reconstruct the SecurityEvent using the fromStored factory method
    return SecurityEvent.fromStored(
      document.eventId,
      document.eventType,
      document.severity,
      {
        source: document.source,
        action: document.action,
        ipHash: document.context.ipHash,
        userAgentHash: document.context.userAgentHash,
        sessionHash: document.context.sessionHash,
      },
      document.metadata,
      document.privacyLevel,
      document.anonymizedId,
      document.timestamp
    );
  }

  /**
   * Ensure proper indexes for privacy-compliant querying
   * 
   * @private
   */
  private async ensureIndexes(collection: Collection<SecurityEventDocument>): Promise<void> {
    // TTL index for automatic deletion
    await collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'ttl_index' }
    );

    // Query optimization indexes
    await collection.createIndex(
      { eventType: 1, timestamp: -1 },
      { name: 'eventtype_timestamp_index' }
    );

    await collection.createIndex(
      { severity: 1, timestamp: -1 },
      { name: 'severity_timestamp_index' }
    );

    await collection.createIndex(
      { source: 1, timestamp: -1 },
      { name: 'source_timestamp_index' }
    );

    await collection.createIndex(
      { timestamp: -1 },
      { name: 'timestamp_index' }
    );

    // Unique index on eventId
    await collection.createIndex(
      { eventId: 1 },
      { unique: true, name: 'eventid_unique_index' }
    );
  }
}
