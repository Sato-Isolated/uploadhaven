/**
 * Security Event Repository Interface - Privacy-Compliant Event Storage
 * 
 * Defines the contract for storing and retrieving security events
 * with strict privacy compliance guarantees.
 * 
 * @domain privacy
 * @pattern Repository Interface (DDD)
 * @privacy zero-knowledge - no sensitive data storage
 */

import { SecurityEvent } from '../entities/SecurityEvent.entity';
import { EventType } from '../value-objects/EventType.vo';

/**
 * Query parameters for security event retrieval
 */
export interface SecurityEventQuery {
  readonly eventType?: EventType;
  readonly severity?: 'low' | 'medium' | 'high' | 'critical';
  readonly source?: 'api' | 'upload' | 'download' | 'auth' | 'system';
  readonly fromDate?: Date;
  readonly toDate?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Aggregated security event statistics (privacy-safe)
 */
export interface SecurityEventStats {
  readonly totalEvents: number;
  readonly eventsByType: Record<string, number>;
  readonly eventsBySeverity: Record<string, number>;
  readonly eventsPerHour: number;
  readonly timeRange: {
    readonly from: Date;
    readonly to: Date;
  };
}

/**
 * Repository interface for privacy-compliant security event management
 */
export interface ISecurityEventRepository {
  /**
   * Save a security event with privacy compliance
   */
  save(event: SecurityEvent): Promise<void>;

  /**
   * Find security events by ID
   */
  findById(id: string): Promise<SecurityEvent | null>;

  /**
   * Query security events with privacy-safe filtering
   */
  query(params: SecurityEventQuery): Promise<SecurityEvent[]>;

  /**
   * Count events matching query (for pagination)
   */
  count(params: Omit<SecurityEventQuery, 'limit' | 'offset'>): Promise<number>;

  /**
   * Get aggregated statistics (privacy-safe)
   */
  getStats(timeRange: { from: Date; to: Date }): Promise<SecurityEventStats>;

  /**
   * Delete old events (privacy compliance - data retention)
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Bulk delete events by query (for GDPR compliance)
   */
  deleteByQuery(params: SecurityEventQuery): Promise<number>;
}
