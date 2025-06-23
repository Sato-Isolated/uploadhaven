/**
 * MongoDB Database Connection - Shared infrastructure for file-sharing domain
 * 
 * Provides a clean database connection abstraction for the new DDD architecture.
 * Reuses the existing MongoDB connection patterns from legacy for consistency.
 * 
 * @domain file-sharing
 * @pattern Infrastructure (DDD)
 * @privacy zero-knowledge - no sensitive data in connection layer
 */

import mongoose from 'mongoose';

// Configuration type
export interface DatabaseConfig {
  readonly mongodbUri: string;
  readonly maxPoolSize?: number;
  readonly serverSelectionTimeoutMS?: number;
  readonly socketTimeoutMS?: number;
  readonly maxIdleTimeMS?: number;
}

// Connection state management
interface ConnectionState {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnecting: boolean;
}

// Global connection cache (following legacy pattern)
declare global {
  /* eslint-disable no-var */
  var __dbConnection: ConnectionState | undefined;
  /* eslint-enable no-var */
}

/**
 * Database connection manager for the file-sharing domain
 * 
 * Provides:
 * - Connection pooling and reuse
 * - Health monitoring and reconnection
 * - Error handling and logging
 * - Configuration management
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private config: DatabaseConfig;
  private connectionState: ConnectionState;

  private constructor(config: DatabaseConfig) {
    this.config = config;

    // Use global cache or initialize new state
    if (!global.__dbConnection) {
      global.__dbConnection = {
        conn: null,
        promise: null,
        isConnecting: false,
      };
    }
    this.connectionState = global.__dbConnection;
  }

  /**
   * Get or create database connection instance
   */
  public static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      const defaultConfig: DatabaseConfig = {
        mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/uploadhaven',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 30000,
      };

      DatabaseConnection.instance = new DatabaseConnection(config || defaultConfig);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Establish database connection with health monitoring
   */
  public async connect(): Promise<typeof mongoose> {
    // Return existing healthy connection
    if (this.connectionState.conn && mongoose.connection.readyState === 1) {
      return this.connectionState.conn;
    }

    // Wait for existing connection attempt
    if (this.connectionState.isConnecting) {
      while (this.connectionState.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.connectionState.conn) return this.connectionState.conn;
    }

    // Create new connection
    if (!this.connectionState.promise) {
      this.connectionState.isConnecting = true;

      const connectionOptions = {
        bufferCommands: false,
        maxPoolSize: this.config.maxPoolSize,
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
        socketTimeoutMS: this.config.socketTimeoutMS,
        family: 4, // Use IPv4
        maxIdleTimeMS: this.config.maxIdleTimeMS,
        maxConnecting: 2,
      };

      this.connectionState.promise = mongoose
        .connect(this.config.mongodbUri, connectionOptions)
        .then((mongoose) => {
          this.connectionState.isConnecting = false;
          this.setupEventListeners();
          console.log('✅ File sharing database connected successfully');
          return mongoose;
        })
        .catch((error) => {
          this.connectionState.isConnecting = false;
          this.connectionState.promise = null;
          console.error('❌ File sharing database connection failed:', error);
          throw error;
        });
    }

    try {
      this.connectionState.conn = await this.connectionState.promise;
      return this.connectionState.conn;
    } catch (error) {
      this.connectionState.promise = null;
      this.connectionState.isConnecting = false;
      throw error;
    }
  }

  /**
   * Set up connection event listeners for monitoring
   */
  private setupEventListeners(): void {
    mongoose.connection.on('error', (err) => {
      console.error('❌ File sharing database error:', err);
      this.connectionState.conn = null;
      this.connectionState.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ File sharing database disconnected');
      this.connectionState.conn = null;
      this.connectionState.promise = null;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 File sharing database reconnected');
    });
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    if (this.connectionState.conn) {
      await mongoose.disconnect();
      this.connectionState.conn = null;
      this.connectionState.promise = null;
      this.connectionState.isConnecting = false;
    }
  }

  /**
   * Check connection health
   */
  public isConnected(): boolean {
    return this.connectionState.conn !== null && mongoose.connection.readyState === 1;
  }
  /**
   * Get connection statistics
   */
  public getStats(): {
    readyState: number;
    host: string;
    name: string;
  } {
    const connection = mongoose.connection;
    return {
      readyState: connection.readyState,
      host: connection.host || 'unknown',
      name: connection.name || 'unknown',
    };
  }
}

/**
 * Default database connection instance
 * Used by repositories for easy access
 */
export const getDatabase = () => DatabaseConnection.getInstance();
