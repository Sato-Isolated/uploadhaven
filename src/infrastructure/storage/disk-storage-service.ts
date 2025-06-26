import { StorageService, FileNotFoundError, StorageError } from '../../domains/storage/storage-service';
import { promises as fs } from 'fs';
import * as path from 'path';

export class DiskStorageService implements StorageService {
  private readonly basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.STORAGE_PATH || './storage';
  }

  generatePath(fileId: string): string {
    // Create subdirectories based on file ID to avoid too many files in one directory
    const subdir1 = fileId.substring(0, 2);
    const subdir2 = fileId.substring(2, 4);
    return path.join(this.basePath, subdir1, subdir2, fileId);
  }

  async save(data: ArrayBuffer, filePath: string): Promise<string> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      const buffer = Buffer.from(data);
      await fs.writeFile(filePath, buffer);

      return filePath;
    } catch (error) {
      throw new StorageError(`Failed to save file: ${error}`);
    }
  }

  async read(filePath: string): Promise<ArrayBuffer> {
    try {
      const buffer = await fs.readFile(filePath);
      // Convert Node.js Buffer to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(buffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
      }
      return arrayBuffer;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        throw new FileNotFoundError(`File not found: ${path}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(`Failed to read file: ${errorMessage}`);
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      
      // Try to remove empty directories
      const dir = path.dirname(filePath);
      try {
        await fs.rmdir(dir);
        // Try to remove parent directory too
        const parentDir = path.dirname(dir);
        await fs.rmdir(parentDir);
      } catch {
        // Ignore errors when removing directories (they might not be empty)
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new StorageError(`Failed to delete file: ${errorMessage}`);
      }
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // This is a simplified cleanup - in production, you'd want more sophisticated logic
    // to identify and remove orphaned files based on database records
    try {
      // For now, just ensure the storage directory exists
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      throw new StorageError(`Failed during cleanup: ${error}`);
    }
  }
}
