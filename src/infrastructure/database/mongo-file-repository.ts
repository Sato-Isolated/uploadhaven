import { FileRepository } from '../../domains/file/file-repository';
import { FileEntity, FileMetadata } from '../../domains/file/file-entity';
import { getCollection } from './mongodb';
import { Document } from 'mongodb';

interface FileDocument extends Document {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  encryptedPath: string;
  uploadedAt: Date;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads?: number;
  passwordHash?: string;
}

export class MongoFileRepository implements FileRepository {
  private readonly collectionName = 'files';

  async save(file: FileEntity): Promise<void> {
    const collection = await getCollection<FileDocument>(this.collectionName);
    const metadata = file.toMetadata();
    
    await collection.replaceOne(
      { id: file.id },
      {
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
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<FileEntity | null> {
    const collection = await getCollection<FileDocument>(this.collectionName);
    const document = await collection.findOne({ id });
    
    if (!document) {
      return null;
    }

    const metadata: FileMetadata = {
      id: document.id,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      encryptedPath: document.encryptedPath,
      uploadedAt: document.uploadedAt,
      expiresAt: document.expiresAt,
      downloadCount: document.downloadCount,
      maxDownloads: document.maxDownloads,
      passwordHash: document.passwordHash,
    };

    return FileEntity.fromMetadata(metadata);
  }

  async delete(id: string): Promise<void> {
    const collection = await getCollection<FileDocument>(this.collectionName);
    await collection.deleteOne({ id });
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const collection = await getCollection<FileDocument>(this.collectionName);
    await collection.updateOne({ id }, { $inc: { downloadCount: 1 } });
  }

  async cleanup(): Promise<void> {
    const collection = await getCollection<FileDocument>(this.collectionName);
    const now = new Date();
    await collection.deleteMany({ expiresAt: { $lt: now } });
  }
}
