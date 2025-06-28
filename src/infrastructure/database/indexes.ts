import { Db } from 'mongodb';
import { logger } from '@/lib/logger';

async function dropLegacyIndexes(db: Db): Promise<void> {
  try {
    // Drop legacy indexes that might conflict
    const collections = ['files', 'shares'];

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();

      for (const index of indexes) {
        // Skip the default _id index
        if (index.name === '_id_') continue;

        // Drop legacy indexes that don't match our new schema
        if (index.name?.includes('shareId') || index.name?.includes('fileId_1') && collectionName === 'files') {
          try {
            await collection.dropIndex(index.name);
            logger.info(`Dropped legacy index: ${index.name} from ${collectionName}`);
          } catch (error) {
            // Ignore if index doesn't exist
            logger.debug(`Could not drop index ${index.name}: ${error}`);
          }
        }
      }
    }
  } catch (error) {
    logger.warn('Error dropping legacy indexes', { error });
  }
}

export async function createIndexes(db: Db): Promise<void> {
  try {
    // First drop any legacy indexes
    await dropLegacyIndexes(db);

    // Files collection indexes
    await db.collection('files').createIndex({ id: 1 }, { unique: true, name: 'id_unique' });
    await db.collection('files').createIndex({ expiresAt: 1 }, { name: 'expiresAt_ttl', expireAfterSeconds: 0 });
    logger.info('Indexes created for files collection');

    // Shares collection indexes
    await db.collection('shares').createIndex({ id: 1 }, { unique: true, name: 'id_unique' });
    await db.collection('shares').createIndex({ fileId: 1 }, { name: 'fileId_index' });
    await db.collection('shares').createIndex({ expiresAt: 1 }, { name: 'expiresAt_ttl', expireAfterSeconds: 0 });
    logger.info('Indexes created for shares collection');
  } catch (error) {
    logger.error('Failed to create indexes', { error });
    throw error;
  }
}
