export interface StorageService {
  save(data: ArrayBuffer, path: string): Promise<string>;
  read(path: string): Promise<ArrayBuffer>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  generatePath(fileId: string): string;
  cleanup(): Promise<void>; // Remove orphaned files
}

export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File not found at path: ${path}`);
    this.name = 'FileNotFoundError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(`Storage error: ${message}`);
    this.name = 'StorageError';
  }
}
