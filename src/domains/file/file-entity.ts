import { randomUUID } from 'crypto';

export interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  encryptedPath: string;
  uploadedAt: Date;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads?: number;
  passwordHash?: string; // Hash du mot de passe si protégé
}

export class FileEntity {
  private constructor(
    public readonly id: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly encryptedPath: string,
    public readonly uploadedAt: Date,
    public readonly expiresAt: Date,
    public readonly downloadCount: number = 0,
    public readonly maxDownloads?: number,
    public readonly passwordHash?: string
  ) {}

  static create(params: {
    originalName: string;
    mimeType: string;
    size: number;
    encryptedPath: string;
    expirationHours?: number;
    maxDownloads?: number;
    passwordHash?: string;
  }): FileEntity {
    const id = randomUUID();
    const uploadedAt = new Date();
    const expiresAt = new Date(uploadedAt.getTime() + (params.expirationHours || 24) * 60 * 60 * 1000);

    return new FileEntity(
      id,
      params.originalName,
      params.mimeType,
      params.size,
      params.encryptedPath,
      uploadedAt,
      expiresAt,
      0,
      params.maxDownloads,
      params.passwordHash
    );
  }

  static fromMetadata(metadata: FileMetadata): FileEntity {
    return new FileEntity(
      metadata.id,
      metadata.originalName,
      metadata.mimeType,
      metadata.size,
      metadata.encryptedPath,
      metadata.uploadedAt,
      metadata.expiresAt,
      metadata.downloadCount,
      metadata.maxDownloads,
      metadata.passwordHash
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  hasReachedMaxDownloads(): boolean {
    return this.maxDownloads != null && this.downloadCount >= this.maxDownloads;
  }

  canBeDownloaded(): boolean {
    return !this.isExpired() && !this.hasReachedMaxDownloads();
  }

  updateEncryptedPath(newPath: string): FileEntity {
    return new FileEntity(
      this.id,
      this.originalName,
      this.mimeType,
      this.size,
      newPath,
      this.uploadedAt,
      this.expiresAt,
      this.downloadCount,
      this.maxDownloads,
      this.passwordHash
    );
  }

  incrementDownloadCount(): FileEntity {
    return new FileEntity(
      this.id,
      this.originalName,
      this.mimeType,
      this.size,
      this.encryptedPath,
      this.uploadedAt,
      this.expiresAt,
      this.downloadCount + 1,
      this.maxDownloads,
      this.passwordHash
    );
  }

  isPasswordProtected(): boolean {
    return !!this.passwordHash;
  }

  toMetadata(): FileMetadata {
    return {
      id: this.id,
      originalName: this.originalName,
      mimeType: this.mimeType,
      size: this.size,
      encryptedPath: this.encryptedPath,
      uploadedAt: this.uploadedAt,
      expiresAt: this.expiresAt,
      downloadCount: this.downloadCount,
      maxDownloads: this.maxDownloads,
      passwordHash: this.passwordHash,
    };
  }
}
