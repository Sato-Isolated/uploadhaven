import { FileEntity } from './file-entity';
import { CountableRepository } from '../shared';
import { PaginationParams, FileSearchFilters, UserFileStats, PaginatedResult } from '../user/user-file-types';

export interface FileRepository extends CountableRepository<FileEntity> {
  incrementDownloadCount(id: string): Promise<void>;
  
  // Méthodes pour les utilisateurs
  findByUserId(userId: string, pagination: PaginationParams, filters?: FileSearchFilters): Promise<PaginatedResult<FileEntity>>;
  countByUserId(userId: string, filters?: FileSearchFilters): Promise<number>;
  deleteByUserAndId(userId: string, fileId: string): Promise<void>;
  getUserFileStats(userId: string): Promise<UserFileStats>;
  findExpiredByUserId(userId: string): Promise<FileEntity[]>;
}

// Les erreurs sont maintenant importées depuis shared/domain-errors.ts
export { 
  FileNotFoundError, 
  FileExpiredError, 
  MaxDownloadsReachedError 
} from '../shared';
