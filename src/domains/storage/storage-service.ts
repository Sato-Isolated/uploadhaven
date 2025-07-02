export interface StorageService {
  save(data: ArrayBuffer, path: string): Promise<string>;
  read(path: string): Promise<ArrayBuffer>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  generatePath(fileId: string): string;
  cleanup(): Promise<void>; // Remove orphaned files
}

// Les erreurs sont maintenant importées depuis shared/domain-errors.ts
export { 
  StorageFileNotFoundError as FileNotFoundError, 
  StorageError 
} from '../shared';
