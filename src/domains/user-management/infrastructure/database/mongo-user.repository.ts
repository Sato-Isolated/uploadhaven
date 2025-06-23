/**
 * 🗄️ MongoDB User Repository - Privacy-Preserving User Storage
 * 
 * Implements user data storage with zero-knowledge encryption.
 * Stores only encrypted user data, hashed emails, and privacy-safe metadata.
 * 
 * @domain user-management
 * @pattern Repository (DDD)
 * @privacy zero-knowledge - server cannot decrypt user data
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { User } from '../../domain/entities/User.entity';
import { UserId } from '../../domain/value-objects/UserId.vo';
import { EmailHash } from '../../domain/value-objects/EmailHash.vo';
import { EncryptedField, EncryptedFieldData } from '../../domain/value-objects/EncryptedField.vo';
import { AccountStatus } from '../../domain/value-objects/AccountStatus.vo';
import { UserPreferences } from '../../domain/value-objects/UserPreferences.vo';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

/**
 * MongoDB document structure for encrypted user storage
 */
interface UserDocument {
  readonly _id: ObjectId;
  readonly userId: string;                    // Public user identifier
  readonly emailHash: string;                 // SHA-256 for privacy-preserving lookups
  readonly encryptedEmail: EncryptedFieldData; // AES-256-GCM encrypted email
  readonly encryptedName?: EncryptedFieldData; // AES-256-GCM encrypted name
  readonly accountStatus: 'active' | 'pending_verification' | 'suspended' | 'deleted';
  readonly preferences: {
    readonly language: 'en' | 'fr' | 'es';
    readonly theme: 'light' | 'dark' | 'system';
    readonly emailNotifications: boolean;
    readonly fileRetentionDays: number;
    readonly maxDownloadsDefault: number;
    readonly autoDeleteEnabled: boolean;
    readonly privacyMode: 'standard' | 'enhanced';
    readonly analyticsOptIn: boolean;
  };
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
  readonly emailVerifiedAt?: Date;
  readonly deletedAt?: Date;                  // Soft deletion for GDPR compliance
  // NO: plaintext email, name, passwords, or other sensitive data
}

/**
 * MongoDB implementation of user repository with privacy guarantees
 */
export class MongoUserRepository implements IUserRepository {
  private readonly collection: Collection<UserDocument>;

  constructor(
    private readonly db: Db,
    collectionName: string = 'users'
  ) {
    this.collection = db.collection<UserDocument>(collectionName);
    this.ensureIndexes();
  }
  /**
   * Save user (create or update)
   */
  async save(user: User): Promise<void> {
    const existingUser = await this.findById(UserId.fromString(user.id));

    if (existingUser) {
      await this.update(user);
    } else {
      await this.store(user);
    }
  }

  /**
   * Store new encrypted user (privacy-preserving)
   */
  private async store(user: User): Promise<void> {
    try {
      const document: UserDocument = {
        _id: new ObjectId(),
        userId: user.id,
        emailHash: user.emailHash,
        encryptedEmail: user.encryptedEmail.toData(),
        encryptedName: user.encryptedName?.toData(), accountStatus: user.accountStatus.status,
        preferences: {
          language: user.preferences.language,
          theme: user.preferences.theme,
          emailNotifications: user.preferences.emailNotifications,
          fileRetentionDays: user.preferences.fileRetentionDays,
          maxDownloadsDefault: user.preferences.maxDownloadsDefault,
          autoDeleteEnabled: user.preferences.autoDeleteEnabled,
          privacyMode: user.preferences.privacyMode,
          analyticsOptIn: user.preferences.analyticsOptIn
        },
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        deletedAt: user.deletedAt
      };

      await this.collection.insertOne(document);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new Error('User already exists');
      }
      throw new Error('Failed to store user');
    }
  }

  /**
   * Find user by ID (returns encrypted user)
   */
  async findById(userId: UserId): Promise<User | null> {
    try {
      const document = await this.collection.findOne({
        userId: userId.value,
        deletedAt: { $exists: false }
      });

      return document ? this.documentToUser(document) : null;
    } catch {
      return null;
    }
  }

  /**
   * Find user by email hash (privacy-preserving lookup)
   */
  async findByEmailHash(emailHash: EmailHash): Promise<User | null> {
    try {
      const document = await this.collection.findOne({
        emailHash: emailHash.value,
        deletedAt: { $exists: false }
      });

      return document ? this.documentToUser(document) : null;
    } catch {
      return null;
    }
  }

  /**
   * Update existing user
   */
  async update(user: User): Promise<void> {
    try {
      const result = await this.collection.updateOne(
        {
          userId: user.id,
          deletedAt: { $exists: false }
        },
        {
          $set: {
            encryptedEmail: user.encryptedEmail.toData(),
            encryptedName: user.encryptedName?.toData(), accountStatus: user.accountStatus.status,
            preferences: {
              language: user.preferences.language,
              theme: user.preferences.theme,
              emailNotifications: user.preferences.emailNotifications,
              fileRetentionDays: user.preferences.fileRetentionDays,
              maxDownloadsDefault: user.preferences.maxDownloadsDefault,
              autoDeleteEnabled: user.preferences.autoDeleteEnabled,
              privacyMode: user.preferences.privacyMode,
              analyticsOptIn: user.preferences.analyticsOptIn
            },
            lastLoginAt: user.lastLoginAt
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to update user');
    }
  }

  /**
   * Soft delete user (GDPR compliant)
   */
  async delete(userId: UserId): Promise<void> {
    try {
      const result = await this.collection.updateOne(
        {
          userId: userId.value,
          deletedAt: { $exists: false }
        },
        {
          $set: {
            deletedAt: new Date(),
            accountStatus: 'deleted' as const
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Check if user exists by email hash
   */
  async existsByEmailHash(emailHash: EmailHash): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({
        emailHash: emailHash.value,
        deletedAt: { $exists: false }
      });
      return count > 0;
    } catch {
      return false;
    }
  }
  /**
   * Find user by email (convenience method - hashes internally)
   */
  async findByEmail(email: string): Promise<User | null> {
    const emailHash = await EmailHash.fromEmail(email);
    return this.findByEmailHash(emailHash);
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const emailHash = await EmailHash.fromEmail(email);
    return this.existsByEmailHash(emailHash);
  }

  /**
   * Find users for administrative purposes (limited data)
   */
  async findUsersForAdmin(options: {
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
  }> {
    try {
      const filter: any = {};

      if (!options.includeDeleted) {
        filter.deletedAt = { $exists: false };
      }

      if (options.statusFilter) {
        filter.accountStatus = options.statusFilter;
      }

      const [users, total] = await Promise.all([
        this.collection
          .find(filter)
          .skip(options.offset || 0)
          .limit(options.limit || 50)
          .sort({ createdAt: -1 })
          .toArray(),
        this.collection.countDocuments(filter)
      ]);

      return {
        users: users.map(doc => ({
          id: doc.userId,
          emailHash: doc.emailHash,
          accountStatus: doc.accountStatus,
          createdAt: doc.createdAt,
          lastLoginAt: doc.lastLoginAt,
          isDeleted: !!doc.deletedAt
        })),
        total
      };
    } catch {
      return { users: [], total: 0 };
    }
  }

  /**
   * Count users by status (privacy-safe analytics)
   */
  async countUsersByStatus(): Promise<{
    active: number;
    pendingVerification: number;
    suspended: number;
    deleted: number;
    total: number;
  }> {
    try {
      const pipeline = [
        { $group: { _id: '$accountStatus', count: { $sum: 1 } } }
      ];

      const results = await this.collection.aggregate(pipeline).toArray();

      const counts = {
        active: 0,
        pendingVerification: 0,
        suspended: 0,
        deleted: 0,
        total: 0
      };

      results.forEach(result => {
        const status = result._id;
        const count = result.count;

        switch (status) {
          case 'active':
            counts.active = count;
            break;
          case 'pending_verification':
            counts.pendingVerification = count;
            break;
          case 'suspended':
            counts.suspended = count;
            break;
          case 'deleted':
            counts.deleted = count;
            break;
        }
        counts.total += count;
      });

      return counts;
    } catch {
      return {
        active: 0,
        pendingVerification: 0,
        suspended: 0,
        deleted: 0,
        total: 0
      };
    }
  }

  /**
   * Find inactive users (for cleanup notifications)
   */
  async findInactiveUsers(inactiveDays: number): Promise<Array<{
    id: string;
    emailHash: string;
    lastLoginAt?: Date;
  }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      const users = await this.collection
        .find({
          $or: [
            { lastLoginAt: { $lt: cutoffDate } },
            { lastLoginAt: { $exists: false }, createdAt: { $lt: cutoffDate } }
          ],
          accountStatus: 'active',
          deletedAt: { $exists: false }
        })
        .project({ userId: 1, emailHash: 1, lastLoginAt: 1 })
        .toArray();

      return users.map(user => ({
        id: user.userId,
        emailHash: user.emailHash,
        lastLoginAt: user.lastLoginAt
      }));
    } catch {
      return [];
    }
  }

  /**
   * Update user last login timestamp
   */
  async updateLastLogin(userId: UserId): Promise<void> {
    try {
      await this.collection.updateOne(
        {
          userId: userId.value,
          deletedAt: { $exists: false }
        },
        {
          $set: { lastLoginAt: new Date() }
        }
      );
    } catch {
      // Silently fail - login tracking is not critical
    }
  }

  /**
   * Mark user email as verified
   */
  async markEmailVerified(userId: UserId): Promise<void> {
    try {
      const result = await this.collection.updateOne(
        {
          userId: userId.value,
          deletedAt: { $exists: false }
        },
        {
          $set: {
            emailVerifiedAt: new Date(),
            accountStatus: 'active' // Activate account when email verified
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to verify email');
    }
  }

  /**
   * Clean up deleted users (GDPR compliance)
   */
  async cleanupDeletedUsers(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.collection.deleteMany({
        deletedAt: { $lt: cutoffDate }
      });

      return result.deletedCount || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get repository health status
   */
  async getHealth(): Promise<{
    isOperational: boolean;
    connectionStatus: string;
    responseTimeMs: number;
    issues: string[];
  }> {
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      // Test basic connectivity
      await this.collection.findOne({}, { projection: { _id: 1 } });

      const responseTime = Date.now() - startTime;

      return {
        isOperational: true,
        connectionStatus: 'connected',
        responseTimeMs: responseTime,
        issues
      };
    } catch (error) {
      issues.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        isOperational: false,
        connectionStatus: 'disconnected',
        responseTimeMs: Date.now() - startTime,
        issues
      };
    }
  }  /**
   * Convert MongoDB document to User domain entity
   */
  private documentToUser(document: UserDocument): User {
    return User.fromData({
      id: document.userId,
      emailHash: document.emailHash,
      encryptedEmail: EncryptedField.fromData(document.encryptedEmail),
      encryptedName: document.encryptedName ? EncryptedField.fromData(document.encryptedName) : undefined,
      accountStatus: AccountStatus.fromData({
        status: document.accountStatus,
        reason: undefined,
        statusChangedAt: document.createdAt // Fallback timestamp
      }),
      preferences: UserPreferences.fromData(document.preferences),
      createdAt: document.createdAt,
      lastLoginAt: document.lastLoginAt,
      deletedAt: document.deletedAt
    });
  }

  /**
   * Ensure required database indexes for performance and uniqueness
   */
  private async ensureIndexes(): Promise<void> {
    try {
      await Promise.all([
        // Unique index on userId for fast lookups
        this.collection.createIndex(
          { userId: 1 },
          { unique: true, background: true, name: 'userId_unique' }
        ),

        // Unique index on emailHash for privacy-preserving email lookups
        this.collection.createIndex(
          { emailHash: 1 },
          { unique: true, background: true, name: 'emailHash_unique' }
        ),

        // Index on accountStatus for filtering
        this.collection.createIndex(
          { accountStatus: 1 },
          { background: true, name: 'accountStatus_index' }
        ),

        // TTL index for automatic cleanup of deleted users
        this.collection.createIndex(
          { deletedAt: 1 },
          {
            expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
            background: true,
            name: 'deletedAt_ttl',
            partialFilterExpression: { deletedAt: { $exists: true } }
          }
        ),

        // Index on createdAt for analytics
        this.collection.createIndex(
          { createdAt: 1 },
          { background: true, name: 'createdAt_index' }
        )
      ]);
    } catch (error) {
      // Index creation errors are not critical during development
      console.warn('Warning: Failed to create some user indexes:', error);
    }
  }
}
