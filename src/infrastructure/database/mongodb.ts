import { MongoClient, Db } from 'mongodb';
import { logger } from '@/lib/logger';
import { createIndexes } from './indexes';

let client: MongoClient | null = null;
let db: Db | null = null;

const DB_NAME = process.env.MONGODB_DB || 'uploadhaven';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

const filesSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'originalName', 'mimeType', 'size', 'encryptedPath', 'uploadedAt', 'expiresAt', 'downloadCount', 'createdAt', 'updatedAt'],
      properties: {
        id: { bsonType: 'string' },
        originalName: { bsonType: 'string' },
        mimeType: { bsonType: 'string' },
        size: { bsonType: 'int' },
        encryptedPath: { bsonType: 'string' },
        uploadedAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' },
        downloadCount: { bsonType: 'int' },
        maxDownloads: { bsonType: ['int', 'null'] },
        passwordHash: { bsonType: ['string', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
};

const sharesSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'fileId', 'shareUrl', 'createdAt', 'updatedAt', 'expiresAt', 'accessCount', 'passwordProtected'],
      properties: {
        id: { bsonType: 'string' },
        fileId: { bsonType: 'string' },
        shareUrl: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' },
        accessCount: { bsonType: 'int' },
        maxAccess: { bsonType: ['int', 'null'] },
        passwordProtected: { bsonType: 'bool' },
        passwordHash: { bsonType: ['string', 'null'] }
      }
    }
  }
};

async function ensureCollectionsWithValidation(db: Db) {
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  if (!collectionNames.includes('files')) {
    await db.createCollection('files', filesSchema);
    logger.info('Created files collection with schema validation');
  }
  if (!collectionNames.includes('shares')) {
    await db.createCollection('shares', sharesSchema);
    logger.info('Created shares collection with schema validation');
  }

  // Create indexes after collections are ready
  await createIndexes(db);
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  try {
    if (!client) {
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 50,
        wtimeoutMS: 2500,
        serverSelectionTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
      });
      await client.connect();
      logger.info('Connected to MongoDB');
    }
    db = client.db(DB_NAME);
    await ensureCollectionsWithValidation(db);
    return db;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
}
