import { getDb } from './mongodb';
import { ShareEntity, ShareMetadata } from '../../domains/share/share-entity';
import { logger } from '../../lib/logger';

export class ShareRepository {
  private readonly collectionName = 'shares';

  async save(share: ShareEntity): Promise<void> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    const metadata = share.toMetadata();
    const now = new Date();
    const document = {
      id: metadata.id,
      fileId: metadata.fileId,
      shareUrl: metadata.shareUrl,
      createdAt: metadata.createdAt || now,
      updatedAt: now,
      expiresAt: metadata.expiresAt,
      accessCount: metadata.accessCount,
      maxAccess: metadata.maxAccess,
      passwordProtected: metadata.passwordProtected,
      passwordHash: metadata.passwordHash,
    };
    try {
      await collection.updateOne(
        { id: share.id },
        { $set: document },
        { upsert: true }
      );
      logger.debug('Share saved successfully', { shareId: share.id });
    } catch (error) {
      logger.error('Failed to save share', { shareId: share.id, error });
      throw error;
    }
  }

  async findById(id: string): Promise<ShareEntity | null> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    try {
      const document = await collection.findOne({ id }, { projection: { _id: 0 } });
      if (!document) return null;
      return ShareEntity.fromMetadata(document as ShareMetadata);
    } catch (error) {
      logger.error('Failed to find share by id', { shareId: id, error });
      throw error;
    }
  }

  async findByFileId(fileId: string): Promise<ShareEntity | null> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    try {
      const document = await collection.findOne(
        { fileId },
        { projection: { _id: 0 }, sort: { createdAt: -1 } }
      );
      if (!document) return null;
      return ShareEntity.fromMetadata(document as ShareMetadata);
    } catch (error) {
      logger.error('Failed to find share by fileId', { fileId, error });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    try {
      const result = await collection.deleteOne({ id });
      if (result.deletedCount === 0) throw new Error('Share not found');
      logger.debug('Share deleted successfully', { shareId: id });
    } catch (error) {
      logger.error('Failed to delete share', { shareId: id, error });
      throw error;
    }
  }

  async incrementAccessCount(id: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    try {
      const result = await collection.updateOne(
        { id },
        { $inc: { accessCount: 1 }, $set: { updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) throw new Error('Share not found');
      logger.debug('Access count incremented', { shareId: id });
    } catch (error) {
      logger.error('Failed to increment access count', { shareId: id, error });
      throw error;
    }
  }

  async cleanup(): Promise<number> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    const now = new Date();
    try {
      const result = await collection.deleteMany({ expiresAt: { $lt: now } });
      if (result.deletedCount > 0) {
        logger.info('Cleaned up expired shares', { count: result.deletedCount });
      }
      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to clean up expired shares', { error });
      throw error;
    }
  }
}
