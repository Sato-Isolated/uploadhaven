import { FileEntity } from './file-entity';

export interface FileRepository {
  save(file: FileEntity): Promise<void>;
  findById(id: string): Promise<FileEntity | null>;
  delete(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;
  cleanup(): Promise<void>; // Remove expired files
}

export class FileNotFoundError extends Error {
  constructor(fileId: string) {
    super(`File with id ${fileId} not found`);
    this.name = 'FileNotFoundError';
  }
}

export class FileExpiredError extends Error {
  constructor(fileId: string) {
    super(`File with id ${fileId} has expired`);
    this.name = 'FileExpiredError';
  }
}

export class MaxDownloadsReachedError extends Error {
  constructor(fileId: string) {
    super(`File with id ${fileId} has reached maximum downloads`);
    this.name = 'MaxDownloadsReachedError';
  }
}
