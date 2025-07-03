import { FileEntity } from './file-entity';
import { CountableRepository } from '../shared';

export interface FileRepository extends CountableRepository<FileEntity> {
  incrementDownloadCount(id: string): Promise<void>;
}

// Les erreurs sont maintenant importées depuis shared/domain-errors.ts
export { 
  FileNotFoundError, 
  FileExpiredError, 
  MaxDownloadsReachedError 
} from '../shared';
