/**
 * 🔐 User Repository Interface - Privacy-First User Data Access
 * 
 * Defines contract for user data persistence with privacy guarantees.
 * Zero-knowledge: Only encrypted data stored, lookups by hash only.
 * 
 * @domain user-management
 * @pattern Repository Interface (DDD)
 * @privacy zero-knowledge - only encrypted data persistence
 */

import { User } from '../entities/User.entity';
import { UserId } from '../value-objects/UserId.vo';
import { EmailHash } from '../value-objects/EmailHash.vo';

/**
 * Repository interface for User aggregate
 */
export interface IUserRepository {
  /**
   * Save user (create or update)
   */
  save(user: User): Promise<void>;

  /**
   * Find user by unique ID
   */
  findById(userId: UserId): Promise<User | null>;

  /**
   * Find user by email hash (privacy-preserving lookup)
   */
  findByEmailHash(emailHash: EmailHash): Promise<User | null>;

  /**
   * Find user by email (convenience method - hashes internally)
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Check if user exists by email hash
   */
  existsByEmailHash(emailHash: EmailHash): Promise<boolean>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Delete user permanently (GDPR compliance)
   */
  delete(userId: UserId): Promise<void>;

  /**
   * Find users for administrative purposes (limited data)
   */
  findUsersForAdmin(options: {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
    statusFilter?: 'active' | 'suspended' | 'pending_verification' | 'deleted';
  }): Promise<{
    users: Array<{
      id: string;
      emailHash: string;
      accountStatus: string;
      createdAt: Date;
      lastLoginAt?: Date;
      isDeleted: boolean;
    }>;
    total: number;
  }>;

  /**
   * Count users by status (privacy-safe analytics)
   */
  countUsersByStatus(): Promise<{
    active: number;
    pendingVerification: number;
    suspended: number;
    deleted: number;
    total: number;
  }>;

  /**
   * Clean up deleted users (permanent deletion after retention period)
   */
  cleanupDeletedUsers(olderThanDays: number): Promise<number>;

  /**
   * Find inactive users (for cleanup notifications)
   */
  findInactiveUsers(inactiveDays: number): Promise<Array<{
    id: string;
    emailHash: string;
    lastLoginAt?: Date;
  }>>;

  /**
   * Update user last login timestamp
   */
  updateLastLogin(userId: UserId): Promise<void>;

  /**
   * Verify user email
   */
  markEmailVerified(userId: UserId): Promise<void>;
}
