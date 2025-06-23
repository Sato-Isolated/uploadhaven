/**
 * Unified Database Service - Manages both Mongoose and Native MongoDB connections
 * 
 * Provides a single point for database connection management that supports both:
 * - Mongoose connections (for existing repositories like MongoFileRepository)
 * - Native MongoDB connections (for new repositories like MongoUserRepository)
 * 
 * @pattern Adapter/Bridge (DDD Infrastructure)
 * @privacy zero-knowledge - no sensitive data in connection management
 */

import mongoose, { Connection } from 'mongoose';
import { MongoClient, Db } from 'mongodb';

/**
 * Database configuration
 */
export interface DatabaseConfig {
  readonly mongodbUri: string;
  readonly databaseName?: string;
  readonly maxPoolSize?: number;
  readonly serverSelectionTimeoutMS?: number;
  readonly socketTimeoutMS?: number;
  readonly maxIdleTimeMS?: number;
}

/**
 * Connection health status
 */
export interface ConnectionHealth {
  readonly isConnected: boolean;
  readonly mongooseReady: boolean;
  readonly nativeDbReady: boolean;
  readonly connectionTime?: Date;
  readonly lastError?: string;
}

/**
 * Unified Database Service
 * 
 * Manages both Mongoose and native MongoDB connections from a single service.
 * Ensures connection reuse and proper lifecycle management.
 */
export class UnifiedDatabaseService {
  private static instance: UnifiedDatabaseService;

  // Connection instances
  private mongooseConnection: typeof mongoose | null = null;
  private nativeClient: MongoClient | null = null;
  private nativeDb: Db | null = null;

  // Connection state
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = this.getConfig();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UnifiedDatabaseService {
    if (!UnifiedDatabaseService.instance) {
      UnifiedDatabaseService.instance = new UnifiedDatabaseService();
    }
    return UnifiedDatabaseService.instance;
  }

  /**
   * Get database configuration from environment
   */
  private getConfig(): DatabaseConfig {
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      throw new Error('❌ MONGODB_URI environment variable is required');
    }

    return {
      mongodbUri,
      databaseName: process.env.MONGODB_DATABASE || 'uploadhaven',
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000')
    };
  }

  /**
   * Connect to database (both Mongoose and native)
   */
  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    this.connectionPromise = this.performConnection();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  /**
   * Perform the actual connection setup
   */
  private async performConnection(): Promise<void> {
    try {
      console.log('🔌 Connecting to MongoDB...');

      // Connect Mongoose (for existing repositories)
      await this.connectMongoose();

      // Connect native MongoDB client (for new repositories)
      await this.connectNative();

      console.log('✅ Database connections established');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Connect Mongoose
   */
  private async connectMongoose(): Promise<void> {
    if (this.mongooseConnection && this.mongooseConnection.connection.readyState === 1) {
      return;
    }

    const options = {
      maxPoolSize: this.config.maxPoolSize,
      serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
      socketTimeoutMS: this.config.socketTimeoutMS,
      maxIdleTimeMS: this.config.maxIdleTimeMS,
      bufferCommands: false,
    };

    this.mongooseConnection = await mongoose.connect(this.config.mongodbUri, options);

    // Setup error handlers
    this.mongooseConnection.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
    });

    this.mongooseConnection.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected');
      this.mongooseConnection = null;
    });
  }

  /**
   * Connect native MongoDB client
   */
  private async connectNative(): Promise<void> {
    if (this.nativeClient && this.nativeDb) {
      return;
    }

    const options = {
      maxPoolSize: this.config.maxPoolSize,
      serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
      socketTimeoutMS: this.config.socketTimeoutMS,
      maxIdleTimeMS: this.config.maxIdleTimeMS,
    };

    this.nativeClient = new MongoClient(this.config.mongodbUri, options);
    await this.nativeClient.connect();

    this.nativeDb = this.nativeClient.db(this.config.databaseName);

    // Setup error handlers
    this.nativeClient.on('error', (error) => {
      console.error('❌ Native MongoDB client error:', error);
    });

    this.nativeClient.on('close', () => {
      console.warn('⚠️ Native MongoDB client disconnected');
      this.nativeClient = null;
      this.nativeDb = null;
    });
  }

  /**
   * Get Mongoose connection (for existing repositories)
   */
  async getMongooseConnection(): Promise<typeof mongoose> {
    await this.connect();

    if (!this.mongooseConnection) {
      throw new Error('❌ Mongoose connection not available');
    }

    return this.mongooseConnection;
  }
  /**
   * Get native MongoDB client (for repositories that need the client)
   */
  async getNativeClient(): Promise<MongoClient> {
    await this.connect();

    if (!this.nativeClient) {
      throw new Error('❌ Native MongoDB client not available');
    }

    return this.nativeClient;
  }

  /**
   * Get native MongoDB database (for new repositories)
   */
  async getNativeDb(): Promise<Db> {
    await this.connect();

    if (!this.nativeDb) {
      throw new Error('❌ Native MongoDB database not available');
    }

    return this.nativeDb;
  }

  /**
   * Check if connections are healthy
   */
  isConnected(): boolean {
    const mongooseReady = this.mongooseConnection?.connection.readyState === 1;
    const nativeReady = this.nativeClient && this.nativeDb;

    return mongooseReady && !!nativeReady;
  }

  /**
   * Get detailed connection health
   */
  async getConnectionHealth(): Promise<ConnectionHealth> {
    const mongooseReady = this.mongooseConnection?.connection.readyState === 1;
    const nativeReady = this.nativeClient && this.nativeDb;

    return {
      isConnected: this.isConnected(),
      mongooseReady: mongooseReady,
      nativeDbReady: !!nativeReady,
      connectionTime: this.mongooseConnection?.connection.readyState === 1
        ? new Date()
        : undefined
    };
  }

  /**
   * Close all connections
   */
  async disconnect(): Promise<void> {
    await this.cleanup();
  }

  /**
   * Cleanup connections
   */
  private async cleanup(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.mongooseConnection) {
      promises.push(this.mongooseConnection.connection.close());
      this.mongooseConnection = null;
    }

    if (this.nativeClient) {
      promises.push(this.nativeClient.close());
      this.nativeClient = null;
      this.nativeDb = null;
    }

    await Promise.all(promises);
  }
  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connect();

      // Test Mongoose connection
      if (this.mongooseConnection?.connection.db) {
        await this.mongooseConnection.connection.db.admin().ping();
      }

      // Test native connection
      if (this.nativeDb) {
        await this.nativeDb.admin().ping();
      }

      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }
}

/**
 * Get database instance (convenience function)
 */
export function getUnifiedDatabase(): UnifiedDatabaseService {
  return UnifiedDatabaseService.getInstance();
}

/**
 * Legacy compatibility - get database connection
 * Maintains compatibility with existing file repository
 */
export async function getDatabase(): Promise<typeof mongoose> {
  const service = UnifiedDatabaseService.getInstance();
  return service.getMongooseConnection();
}
