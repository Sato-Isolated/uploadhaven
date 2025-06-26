import { ShareRepository } from '../../domains/share/share-repository';
import { ShareEntity, ShareMetadata } from '../../domains/share/share-entity';
import { getCollection } from './mongodb';
import { Document } from 'mongodb';

interface ShareDocument extends Document {
  id: string;
  fileId: string;
  shareUrl: string;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  maxAccess?: number;
  passwordProtected: boolean;
}

export class MongoShareRepository implements ShareRepository {
  private readonly collectionName = 'shares';

  async save(share: ShareEntity): Promise<void> {
    const collection = await getCollection<ShareDocument>(this.collectionName);
    const metadata = share.toMetadata();
    
    await collection.replaceOne(
      { id: share.id },
      {
        id: metadata.id,
        fileId: metadata.fileId,
        shareUrl: metadata.shareUrl,
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        accessCount: metadata.accessCount,
        maxAccess: metadata.maxAccess,
        passwordProtected: metadata.passwordProtected,
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<ShareEntity | null> {
    const collection = await getCollection<ShareDocument>(this.collectionName);
    const document = await collection.findOne({ id });
    
    if (!document) {
      return null;
    }

    const metadata: ShareMetadata = {
      id: document.id,
      fileId: document.fileId,
      shareUrl: document.shareUrl,
      createdAt: document.createdAt,
      expiresAt: document.expiresAt,
      accessCount: document.accessCount,
      maxAccess: document.maxAccess,
      passwordProtected: document.passwordProtected,
    };

    return ShareEntity.fromMetadata(metadata);
  }

  async findByFileId(fileId: string): Promise<ShareEntity | null> {
    const collection = await getCollection<ShareDocument>(this.collectionName);
    const document = await collection.findOne({ fileId });
    
    if (!document) {
      return null;
    }

    const metadata: ShareMetadata = {
      id: document.id,
      fileId: document.fileId,
      shareUrl: document.shareUrl,
      createdAt: document.createdAt,
      expiresAt: document.expiresAt,
      accessCount: document.accessCount,
      maxAccess: document.maxAccess,
      passwordProtected: document.passwordProtected,
    };

    return ShareEntity.fromMetadata(metadata);
  }

  async delete(id: string): Promise<void> {
    const collection = await getCollection<ShareDocument>(this.collectionName);
    await collection.deleteOne({ id });
  }

  async incrementAccessCount(id: string): Promise<void> {
    const collection = await getCollection<ShareDocument>(this.collectionName);
    await collection.updateOne({ id }, { $inc: { accessCount: 1 } });
  }

  async cleanup(): Promise<void> {
    const collection = await getCollection<ShareDocument>(this.collectionName);
    const now = new Date();
    await collection.deleteMany({ expiresAt: { $lt: now } });
  }
}
