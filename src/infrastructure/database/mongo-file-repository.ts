import { getDb } from './mongodb';
import { FileEntity, FileMetadata } from '../../domains/file/file-entity';
import { logger } from '../../lib/logger';

export class FileRepository {
  private readonly collectionName = 'files';

  async save(file: FileEntity): Promise<void> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    const metadata = file.toMetadata();
    const now = new Date();
    const document = {
      id: metadata.id,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      encryptedPath: metadata.encryptedPath,
      uploadedAt: metadata.uploadedAt,
      expiresAt: metadata.expiresAt,
      downloadCount: metadata.downloadCount,
      maxDownloads: metadata.maxDownloads,
      passwordHash: metadata.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await collection.updateOne(
        { id: file.id },
        { $set: document },
        { upsert: true }
      );
      logger.debug('File saved successfully', { fileId: file.id });
    } catch (error) {
      logger.error('Failed to save file', { fileId: file.id, error });
      throw error;
    }
  }

  async findById(id: string): Promise<FileEntity | null> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    try {
      const document = await collection.findOne({ id }, { projection: { _id: 0 } });
      if (!document) return null;
      return FileEntity.fromMetadata(document as FileMetadata);
    } catch (error) {
      logger.error('Failed to find file by id', { fileId: id, error });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    try {
      const result = await collection.deleteOne({ id });
      if (result.deletedCount === 0) throw new Error('File not found');
      logger.debug('File deleted successfully', { fileId: id });
    } catch (error) {
      logger.error('Failed to delete file', { fileId: id, error });
      throw error;
    }
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    try {
      const result = await collection.updateOne(
        { id },
        { $inc: { downloadCount: 1 }, $set: { updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) throw new Error('File not found');
      logger.debug('Download count incremented', { fileId: id });
    } catch (error) {
      logger.error('Failed to increment download count', { fileId: id, error });
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
        logger.info('Cleaned up expired files', { count: result.deletedCount });
      }
      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to clean up expired files', { error });
      throw error;
    }
  }
}
