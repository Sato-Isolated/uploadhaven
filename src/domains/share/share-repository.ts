import { ShareEntity } from './share-entity';
import { CountableRepository } from '../shared';

export interface ShareRepository extends CountableRepository<ShareEntity> {
  findByFileId(fileId: string): Promise<ShareEntity | null>;
  incrementAccessCount(id: string): Promise<void>;
}

// Les erreurs sont maintenant importées depuis shared/domain-errors.ts
export { 
  ShareNotFoundError, 
  ShareExpiredError, 
  MaxAccessReachedError 
} from '../shared';
