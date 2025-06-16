#!/usr/bin/env tsx
import connectDB from '@/lib/database/mongodb';
import { User, File, SecurityEvent, Notification } from '@/lib/database/models';

/**
 * Database migration script for UploadHaven
 * Handles schema updates and data migrations
 */

interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: '1.0.0',
    description: 'Initial database setup with indexes',
    up: async () => {
      console.log('Creating initial indexes...');
      
      // User indexes
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ role: 1 });
      await User.collection.createIndex({ lastActivity: -1 });
      
      // File indexes
      await File.collection.createIndex({ shortUrl: 1 }, { unique: true });
      await File.collection.createIndex({ filename: 1 }, { unique: true });
      await File.collection.createIndex({ uploadDate: -1 });
      await File.collection.createIndex({ expiresAt: 1 });
      await File.collection.createIndex({ isDeleted: 1 });
      await File.collection.createIndex({ userId: 1, uploadDate: -1 });
      
      // Security event indexes
      await SecurityEvent.collection.createIndex({ timestamp: -1 });
      await SecurityEvent.collection.createIndex({ type: 1, timestamp: -1 });
      await SecurityEvent.collection.createIndex({ ip: 1 });
      await SecurityEvent.collection.createIndex({ severity: 1, timestamp: -1 });
      
      console.log('✅ Initial indexes created');
    },
    down: async () => {
      console.log('Dropping initial indexes...');
      await User.collection.dropIndexes();
      await File.collection.dropIndexes();
      await SecurityEvent.collection.dropIndexes();
      console.log('✅ Initial indexes dropped');
    }
  },
  {
    version: '1.1.0',
    description: 'Add notification system',
    up: async () => {
      console.log('Setting up notification system...');
      
      // Notification indexes
      await Notification.collection.createIndex({ userId: 1, createdAt: -1 });
      await Notification.collection.createIndex({ isRead: 1 });
      await Notification.collection.createIndex({ priority: 1 });
      await Notification.collection.createIndex({ expiresAt: 1 });
      
      console.log('✅ Notification system setup complete');
    },
    down: async () => {
      console.log('Removing notification system...');
      await Notification.collection.drop().catch(() => {});
      console.log('✅ Notification system removed');
    }
  },
  {
    version: '1.2.0',
    description: 'Add TTL indexes for automatic cleanup',
    up: async () => {
      console.log('Adding TTL indexes for automatic cleanup...');
      
      // TTL index for expired files (cleanup 24 hours after expiration)
      await File.collection.createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 86400 } // 24 hours
      );
      
      // TTL index for old security events (cleanup after 90 days)
      await SecurityEvent.collection.createIndex(
        { timestamp: 1 }, 
        { expireAfterSeconds: 7776000 } // 90 days
      );
      
      // TTL index for expired notifications
      await Notification.collection.createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 0 } // Immediate cleanup when expiresAt is reached
      );
      
      console.log('✅ TTL indexes added');
    },
    down: async () => {
      console.log('Removing TTL indexes...');
      // Note: MongoDB doesn't allow dropping specific indexes easily
      // This would require recreating indexes without TTL
      console.log('⚠️  TTL index removal requires manual intervention');
    }
  },
  {
    version: '1.3.0',
    description: 'Add compound indexes for better performance',
    up: async () => {
      console.log('Adding compound indexes...');
      
      // Compound index for user files query
      await File.collection.createIndex({ 
        userId: 1, 
        isDeleted: 1, 
        uploadDate: -1 
      });
      
      // Compound index for security event filtering
      await SecurityEvent.collection.createIndex({ 
        type: 1, 
        severity: 1, 
        timestamp: -1 
      });
      
      // Compound index for notification queries
      await Notification.collection.createIndex({ 
        userId: 1, 
        isRead: 1, 
        priority: 1, 
        createdAt: -1 
      });
      
      console.log('✅ Compound indexes added');
    },
    down: async () => {
      console.log('Removing compound indexes...');
      // These would need to be dropped individually
      console.log('⚠️  Compound index removal requires manual intervention');
    }
  }
];

async function getCurrentVersion(): Promise<string> {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const migrations = db.collection('migrations');
    const lastMigration = await migrations.findOne({}, { sort: { version: -1 } });
    return lastMigration?.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
}

async function setVersion(version: string): Promise<void> {
  const mongoose = await connectDB();
  const db = mongoose.connection.db;
  
  if (!db) {
    throw new Error('Database connection not available');
  }
  
  const migrations = db.collection('migrations');
  await migrations.insertOne({
    version,
    appliedAt: new Date(),
    description: `Migration to version ${version}`
  });
}

async function runMigrations(targetVersion?: string) {
  try {
    console.log('🔄 Starting database migrations...');
    
    await connectDB();
    console.log('✅ Connected to database');
    
    const currentVersion = await getCurrentVersion();
    console.log(`📊 Current database version: ${currentVersion}`);
    
    // Filter migrations to run
    const migrationsToRun = migrations.filter(migration => {
      if (targetVersion) {
        return migration.version <= targetVersion && migration.version > currentVersion;
      }
      return migration.version > currentVersion;
    });
    
    if (migrationsToRun.length === 0) {
      console.log('✅ Database is already up to date');
      return;
    }
    
    console.log(`📝 Running ${migrationsToRun.length} migrations...`);
    
    for (const migration of migrationsToRun) {
      console.log(`\n🔄 Running migration ${migration.version}: ${migration.description}`);
      
      try {
        await migration.up();
        await setVersion(migration.version);
        console.log(`✅ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
    
    const finalVersion = await getCurrentVersion();
    console.log(`\n🎉 All migrations completed successfully!`);
    console.log(`📊 Database updated to version: ${finalVersion}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

async function rollbackMigration(version: string) {
  try {
    console.log(`🔄 Rolling back to version ${version}...`);
    
    await connectDB();
    console.log('✅ Connected to database');
    
    const currentVersion = await getCurrentVersion();
    console.log(`📊 Current database version: ${currentVersion}`);
    
    // Find migrations to rollback
    const migrationsToRollback = migrations
      .filter(migration => migration.version > version && migration.version <= currentVersion)
      .reverse(); // Rollback in reverse order
    
    if (migrationsToRollback.length === 0) {
      console.log('✅ No migrations to rollback');
      return;
    }
    
    console.log(`📝 Rolling back ${migrationsToRollback.length} migrations...`);
    
    for (const migration of migrationsToRollback) {
      console.log(`\n🔄 Rolling back migration ${migration.version}: ${migration.description}`);
      
      try {
        await migration.down();        // Remove migration record
        const mongoose = await connectDB();
        const db = mongoose.connection.db;
        
        if (!db) {
          throw new Error('Database connection not available');
        }
        
        await db.collection('migrations').deleteOne({ version: migration.version });
        console.log(`✅ Migration ${migration.version} rolled back`);
      } catch (error) {
        console.error(`❌ Rollback ${migration.version} failed:`, error);
        throw error;
      }
    }
    
    console.log(`\n🎉 Rollback completed successfully!`);
    console.log(`📊 Database rolled back to version: ${version}`);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// CLI interface
const command = process.argv[2];
const version = process.argv[3];

switch (command) {
  case 'up':
    runMigrations(version);
    break;
  case 'down':
    if (!version) {
      console.error('❌ Version required for rollback');
      process.exit(1);
    }
    rollbackMigration(version);
    break;
  case 'status':
    getCurrentVersion().then(v => {
      console.log(`📊 Current database version: ${v}`);
      process.exit(0);
    });
    break;
  default:
    runMigrations();
}

export { runMigrations, rollbackMigration, getCurrentVersion };
