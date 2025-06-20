#!/usr/bin/env tsx
import connectDB from '@/lib/database/mongodb';
import { User, File, Notification } from '@/lib/database/models';
import { AuditLog } from '@/lib/database/audit-models';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Database reset script for UploadHaven
 * Completely resets the database and file storage
 */

async function confirmReset(): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Database reset is not allowed in production environment');
    return false;
  }

  // Check for --force flag
  if (process.argv.includes('--force')) {
    return true;
  }

  // In development, show warning
  console.log('⚠️  This will completely reset the database and remove all files!');
  console.log('⚠️  This action cannot be undone.');
  console.log('');
  console.log('To proceed, run: pnpm db:reset --force');
  
  return false;
}

async function cleanupFileStorage() {
  try {
    console.log('🧹 Cleaning up file storage...');
    
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const publicDir = path.join(uploadDir, 'public');
    const protectedDir = path.join(uploadDir, 'protected');
    
    // Clean public directory
    try {
      const publicFiles = await fs.readdir(publicDir);
      for (const file of publicFiles) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(publicDir, file));
        }
      }
      console.log(`✅ Cleaned ${publicFiles.length - 1} files from public directory`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Warning: Could not clean public directory:', error.message);
      }
    }
    
    // Clean protected directory
    try {
      const protectedFiles = await fs.readdir(protectedDir);
      for (const file of protectedFiles) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(protectedDir, file));
        }
      }
      console.log(`✅ Cleaned ${protectedFiles.length - 1} files from protected directory`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Warning: Could not clean protected directory:', error.message);
      }
    }
    
    // Clean temporary files
    try {
      const tempDir = path.join(uploadDir, 'temp');
      const tempFiles = await fs.readdir(tempDir);
      for (const file of tempFiles) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(tempDir, file));
        }
      }
      console.log(`✅ Cleaned ${tempFiles.length - 1} temporary files`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Warning: Could not clean temp directory:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error cleaning file storage:', error);
    throw error;
  }
}

async function dropCollections() {
  try {
    console.log('🗑️  Dropping database collections...');
    
    const collections = [
      { model: User, name: 'users' },
      { model: File, name: 'files' },
      { model: AuditLog, name: 'audit_logs' },
      { model: Notification, name: 'notifications' }
    ];
    
    for (const { model, name } of collections) {
      try {
        await model.collection.drop();
        console.log(`✅ Dropped ${name} collection`);
      } catch (error: any) {
        if (error.code === 26) { // NamespaceNotFound
          console.log(`ℹ️  Collection ${name} does not exist`);
        } else {
          throw error;
        }
      }
    }
      // Drop migrations collection
    try {
      const mongoose = await connectDB();
      const db = mongoose.connection.db;
      
      if (db) {
        await db.collection('migrations').drop();
        console.log('✅ Dropped migrations collection');
      }
    } catch (error: any) {
      if (error.code === 26) {
        console.log('ℹ️  Migrations collection does not exist');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error dropping collections:', error);
    throw error;
  }
}

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Drop all collections
    await dropCollections();
    
    // Clean up file storage
    await cleanupFileStorage();
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run migrations: pnpm db:migrate');
    console.log('2. Seed test data: pnpm db:seed');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

async function resetWithMigrationAndSeed() {
  try {
    console.log('🔄 Starting complete database reset with setup...');
    
    // Reset database
    await connectDB();
    await dropCollections();
    await cleanupFileStorage();
    
    console.log('✅ Database reset completed');
    
    // Run migrations
    console.log('\n🔄 Running migrations...');
    const { runMigrations } = await import('./migrate-database');
    await runMigrations();
    
    console.log('✅ Migrations completed');
    
    // Seed database
    console.log('\n🔄 Seeding database...');
    const { seedDatabase } = await import('./seed-database');
    await seedDatabase();
    
    console.log('\n🎉 Complete database setup finished!');
    
  } catch (error) {
    console.error('❌ Complete reset failed:', error);
    process.exit(1);
  }
}

// Check for setup flag
const shouldSetup = process.argv.includes('--setup');

// Main execution
async function main() {
  const canReset = await confirmReset();
  
  if (!canReset) {
    process.exit(1);
  }
  
  if (shouldSetup) {
    await resetWithMigrationAndSeed();
  } else {
    await resetDatabase();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { resetDatabase, cleanupFileStorage };
