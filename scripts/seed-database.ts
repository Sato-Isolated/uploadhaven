#!/usr/bin/env tsx
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { File } from '@/lib/models';
import { SecurityEvent } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

/**
 * Database seeding script for UploadHaven
 * Creates test data for development and testing
 */

interface SeedData {
  users: {
    admin: any;
    testUser: any;
  };
  files: any[];
  securityEvents: any[];
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Clear existing data (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Clearing existing data...');
      await Promise.all([
        User.deleteMany({}),
        File.deleteMany({}),
        SecurityEvent.deleteMany({})
      ]);
      console.log('✅ Existing data cleared');
    }

    const seedData: SeedData = {
      users: {
        admin: null,
        testUser: null
      },
      files: [],
      securityEvents: []
    };

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    seedData.users.admin = await User.create({
      name: 'Admin User',
      email: 'admin@uploadhaven.dev',
      password: adminPassword,
      role: 'admin',
      emailVerified: true,
      lastActivity: new Date(),
    });
    console.log('✅ Admin user created');

    // Create test user
    console.log('👤 Creating test user...');
    const testPassword = await bcrypt.hash('Test123!', 12);
    seedData.users.testUser = await User.create({
      name: 'Test User',
      email: 'test@uploadhaven.dev',
      password: testPassword,
      role: 'user',
      emailVerified: true,
      lastActivity: new Date(),
    });
    console.log('✅ Test user created');

    // Create sample files
    console.log('📁 Creating sample files...');
    const sampleFiles = [
      {
        filename: `${nanoid()}.txt`,
        shortUrl: nanoid(10),
        originalName: 'sample-document.txt',
        mimeType: 'text/plain',
        size: 1024,
        uploadDate: new Date(Date.now() - 86400000), // 1 day ago
        expiresAt: new Date(Date.now() + 86400000 * 7), // 7 days from now
        downloadCount: 5,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        scanResult: {
          safe: true,
          threat: null,
          scanDate: new Date(Date.now() - 86400000)
        },
        isDeleted: false,
        userId: seedData.users.testUser._id.toString(),
        isAnonymous: false,
        isPasswordProtected: false
      },
      {
        filename: `${nanoid()}.jpg`,
        shortUrl: nanoid(10),
        originalName: 'vacation-photo.jpg',
        mimeType: 'image/jpeg',
        size: 2048000,
        uploadDate: new Date(Date.now() - 43200000), // 12 hours ago
        expiresAt: new Date(Date.now() + 86400000 * 30), // 30 days from now
        downloadCount: 12,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        scanResult: {
          safe: true,
          threat: null,
          scanDate: new Date(Date.now() - 43200000)
        },
        isDeleted: false,
        userId: seedData.users.testUser._id.toString(),
        isAnonymous: false,
        isPasswordProtected: true,
        password: await bcrypt.hash('photo123', 12)
      },
      {
        filename: `${nanoid()}.pdf`,
        shortUrl: nanoid(10),
        originalName: 'anonymous-report.pdf',
        mimeType: 'application/pdf',
        size: 512000,
        uploadDate: new Date(Date.now() - 21600000), // 6 hours ago
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        downloadCount: 3,
        ipAddress: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        scanResult: {
          safe: true,
          threat: null,
          scanDate: new Date(Date.now() - 21600000)
        },
        isDeleted: false,
        isAnonymous: true,
        isPasswordProtected: false
      }
    ];

    for (const fileData of sampleFiles) {
      const file = await File.create(fileData);
      seedData.files.push(file);
    }
    console.log(`✅ Created ${seedData.files.length} sample files`);

    // Create security events
    console.log('🔒 Creating security events...');
    const securityEvents = [
      {
        type: 'file_upload',
        timestamp: new Date(Date.now() - 86400000),
        ip: '192.168.1.100',
        details: 'File uploaded successfully',
        severity: 'low',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        filename: seedData.files[0].filename,
        fileSize: seedData.files[0].size,
        fileType: seedData.files[0].mimeType,
        userId: seedData.users.testUser._id.toString()
      },
      {
        type: 'file_download',
        timestamp: new Date(Date.now() - 43200000),
        ip: '203.0.113.5',
        details: 'File downloaded by anonymous user',
        severity: 'low',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        filename: seedData.files[1].filename,
        fileSize: seedData.files[1].size,
        fileType: seedData.files[1].mimeType
      },
      {
        type: 'rate_limit',
        timestamp: new Date(Date.now() - 21600000),
        ip: '203.0.113.10',
        details: 'Rate limit exceeded for upload endpoint',
        severity: 'medium',
        userAgent: 'curl/7.68.0'
      },
      {
        type: 'suspicious_activity',
        timestamp: new Date(Date.now() - 10800000),
        ip: '198.51.100.1',
        details: 'Multiple failed authentication attempts',
        severity: 'high',
        userAgent: 'Mozilla/5.0 (compatible; automated scanner)'
      }
    ];

    for (const eventData of securityEvents) {
      const event = await SecurityEvent.create(eventData);
      seedData.securityEvents.push(event);
    }
    console.log(`✅ Created ${seedData.securityEvents.length} security events`);

    // Create indexes if they don't exist
    console.log('📊 Creating database indexes...');
    await Promise.all([
      User.collection.createIndex({ email: 1 }, { unique: true }),
      User.collection.createIndex({ role: 1 }),
      User.collection.createIndex({ lastActivity: -1 }),
      
      File.collection.createIndex({ shortUrl: 1 }, { unique: true }),
      File.collection.createIndex({ filename: 1 }, { unique: true }),
      File.collection.createIndex({ uploadDate: -1 }),
      File.collection.createIndex({ expiresAt: 1 }),
      File.collection.createIndex({ isDeleted: 1 }),
      File.collection.createIndex({ userId: 1, uploadDate: -1 }),
      
      SecurityEvent.collection.createIndex({ timestamp: -1 }),
      SecurityEvent.collection.createIndex({ type: 1, timestamp: -1 }),
      SecurityEvent.collection.createIndex({ ip: 1 }),
      SecurityEvent.collection.createIndex({ severity: 1, timestamp: -1 })
    ]);
    console.log('✅ Database indexes created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nTest accounts created:');
    console.log(`📧 Admin: admin@uploadhaven.dev / Admin123!`);
    console.log(`📧 User: test@uploadhaven.dev / Test123!`);
    console.log(`\n📊 Summary:`);
    console.log(`  - Users: 2`);
    console.log(`  - Files: ${seedData.files.length}`);
    console.log(`  - Security Events: ${seedData.securityEvents.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
