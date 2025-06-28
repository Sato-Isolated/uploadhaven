import { ShareEntity } from './share-entity';

export interface ShareRepository {
  save(share: ShareEntity): Promise<void>;
  findById(id: string): Promise<ShareEntity | null>;
  findByFileId(fileId: string): Promise<ShareEntity | null>;
  delete(id: string): Promise<void>;
  incrementAccessCount(id: string): Promise<void>;
  cleanup(): Promise<number>; // Remove expired shares and return count of removed shares
}

export class ShareNotFoundError extends Error {
  constructor(shareId: string) {
    super(`Share with id ${shareId} not found`);
    this.name = 'ShareNotFoundError';
  }
}

export class ShareExpiredError extends Error {
  constructor(shareId: string) {
    super(`Share with id ${shareId} has expired`);
    this.name = 'ShareExpiredError';
  }
}

export class MaxAccessReachedError extends Error {
  constructor(shareId: string) {
    super(`Share with id ${shareId} has reached maximum access count`);
    this.name = 'MaxAccessReachedError';
  }
}
