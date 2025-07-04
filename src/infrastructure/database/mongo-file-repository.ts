import { getDb } from './mongodb';
import { FileEntity, FileMetadata } from '../../domains/file/file-entity';
import { FileRepository as FileRepositoryInterface } from '../../domains/file/file-repository';
import { PaginationParams, FileSearchFilters, UserFileStats, PaginatedResult } from '../../domains/user/user-file-types';
import { logger } from '../../lib/logger';

export class MongoFileRepository implements FileRepositoryInterface {
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
      userId: metadata.userId,
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
      return FileEntity.fromMetadata(document as unknown as FileMetadata);
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

  async incrementCount(id: string): Promise<void> {
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

  async incrementDownloadCount(id: string): Promise<void> {
    return this.incrementCount(id);
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

  // Nouvelles méthodes pour les utilisateurs

  async findByUserId(
    userId: string, 
    pagination: PaginationParams, 
    filters?: FileSearchFilters
  ): Promise<PaginatedResult<FileEntity>> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    
    try {
      // Construction de la query MongoDB
      const query: any = { userId };
      
      if (filters) {
        if (filters.name) {
          query.originalName = { $regex: filters.name, $options: 'i' };
        }
        
        if (filters.startDate || filters.endDate) {
          query.uploadedAt = {};
          if (filters.startDate) query.uploadedAt.$gte = filters.startDate;
          if (filters.endDate) query.uploadedAt.$lte = filters.endDate;
        }
        
        if (filters.minSize || filters.maxSize) {
          query.size = {};
          if (filters.minSize) query.size.$gte = filters.minSize;
          if (filters.maxSize) query.size.$lte = filters.maxSize;
        }
        
        if (filters.mimeType) {
          query.mimeType = { $regex: filters.mimeType, $options: 'i' };
        }
        
        if (filters.status) {
          const now = new Date();
          const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          switch (filters.status) {
            case 'active':
              query.expiresAt = { $gt: now };
              break;
            case 'expired':
              query.expiresAt = { $lte: now };
              break;
            case 'expiring_soon':
              query.expiresAt = { $gt: now, $lte: in24Hours };
              break;
          }
        }
      }
      
      // Configuration du tri
      const sortField = pagination.sortBy || 'uploadedAt';
      const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };
      
      // Calcul de la pagination
      const skip = (pagination.page - 1) * pagination.limit;
      
      // Exécution des requêtes
      const [documents, total] = await Promise.all([
        collection
          .find(query, { projection: { _id: 0 } })
          .sort(sort)
          .skip(skip)
          .limit(pagination.limit)
          .toArray(),
        collection.countDocuments(query)
      ]);
      
      const files = documents.map(doc => FileEntity.fromMetadata(doc as unknown as FileMetadata));
      
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: files,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      };
    } catch (error) {
      logger.error('Failed to find files by user id', { userId, error });
      throw error;
    }
  }

  async countByUserId(userId: string, filters?: FileSearchFilters): Promise<number> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    
    try {
      const query: any = { userId };
      
      if (filters) {
        // Appliquer les mêmes filtres que dans findByUserId
        if (filters.name) {
          query.originalName = { $regex: filters.name, $options: 'i' };
        }
        // ... autres filtres (même logique que findByUserId)
      }
      
      return await collection.countDocuments(query);
    } catch (error) {
      logger.error('Failed to count files by user id', { userId, error });
      throw error;
    }
  }

  async deleteByUserAndId(userId: string, fileId: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    
    try {
      const result = await collection.deleteOne({ id: fileId, userId });
      if (result.deletedCount === 0) {
        throw new Error('File not found or not owned by user');
      }
      logger.info('File deleted by user', { userId, fileId });
    } catch (error) {
      logger.error('Failed to delete file by user', { userId, fileId, error });
      throw error;
    }
  }

  async getUserFileStats(userId: string): Promise<UserFileStats> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const pipeline = [
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            totalSize: { $sum: '$size' },
            activeFiles: {
              $sum: { $cond: [{ $gt: ['$expiresAt', now] }, 1, 0] }
            },
            expiredFiles: {
              $sum: { $cond: [{ $lte: ['$expiresAt', now] }, 1, 0] }
            },
            expiringFiles: {
              $sum: { 
                $cond: [
                  { $and: [
                    { $gt: ['$expiresAt', now] },
                    { $lte: ['$expiresAt', in24Hours] }
                  ]}, 
                  1, 
                  0
                ] 
              }
            },
            totalDownloads: { $sum: '$downloadCount' },
            files: { $push: { id: '$id', name: '$originalName', downloads: '$downloadCount' } }
          }
        }
      ];
      
      const [result] = await collection.aggregate(pipeline).toArray();
      
      if (!result) {
        return {
          totalFiles: 0,
          totalSize: 0,
          activeFiles: 0,
          expiredFiles: 0,
          expiringFiles: 0,
          totalDownloads: 0,
        };
      }
      
      // Trouver le fichier le plus téléchargé
      const mostDownloaded = result.files
        .sort((a: any, b: any) => b.downloads - a.downloads)[0];
      
      return {
        totalFiles: result.totalFiles,
        totalSize: result.totalSize,
        activeFiles: result.activeFiles,
        expiredFiles: result.expiredFiles,
        expiringFiles: result.expiringFiles,
        totalDownloads: result.totalDownloads,
        mostDownloadedFile: mostDownloaded?.downloads > 0 ? {
          id: mostDownloaded.id,
          name: mostDownloaded.name,
          downloads: mostDownloaded.downloads,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to get user file stats', { userId, error });
      throw error;
    }
  }

  async findExpiredByUserId(userId: string): Promise<FileEntity[]> {
    const db = await getDb();
    const collection = db.collection(this.collectionName);
    
    try {
      const now = new Date();
      const documents = await collection
        .find(
          { userId, expiresAt: { $lte: now } },
          { projection: { _id: 0 } }
        )
        .toArray();
      
      return documents.map(doc => FileEntity.fromMetadata(doc as unknown as FileMetadata));
    } catch (error) {
      logger.error('Failed to find expired files by user id', { userId, error });
      throw error;
    }
  }
}

// Export alias for backward compatibility
export { MongoFileRepository as FileRepository };
