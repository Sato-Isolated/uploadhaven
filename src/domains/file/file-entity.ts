import { BaseEntity, BaseCreateParams, Expirable, Countable, EntityUtils } from '../shared';

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
  passwordHash?: string; // Password hash if protected
  userId?: string; // User ID if uploaded by authenticated user
}

export interface FileCreateParams extends BaseCreateParams {
  originalName: string;
  mimeType: string;
  size: number;
  encryptedPath: string;
  maxDownloads?: number;
  passwordHash?: string;
  userId?: string; // User ID if uploaded by authenticated user
}

export class FileEntity implements BaseEntity, Expirable, Countable<FileEntity> {
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
    public readonly passwordHash?: string,
    public readonly userId?: string
  ) { }

  // Alias pour l'interface BaseEntity
  get createdAt(): Date {
    return this.uploadedAt;
  }

  // Alias pour l'interface Countable
  get count(): number {
    return this.downloadCount;
  }

  get maxCount(): number | undefined {
    return this.maxDownloads;
  }

  static create(params: FileCreateParams): FileEntity {
    const id = EntityUtils.generateId();
    const uploadedAt = new Date();
    const expiresAt = EntityUtils.calculateExpirationDate(params.expirationHours);

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
      params.passwordHash,
      params.userId
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
      metadata.passwordHash,
      metadata.userId
    );
  }

  isExpired(): boolean {
    return EntityUtils.isExpired(this.expiresAt);
  }

  hasReachedMaxCount(): boolean {
    return this.maxDownloads != null && this.downloadCount >= this.maxDownloads;
  }

  hasReachedMaxDownloads(): boolean {
    return this.hasReachedMaxCount();
  }

  canBeAccessed(): boolean {
    return !this.isExpired() && !this.hasReachedMaxCount();
  }

  canBeDownloaded(): boolean {
    return this.canBeAccessed();
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
      this.passwordHash,
      this.userId
    );
  }

  incrementCount(): FileEntity {
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
      this.passwordHash,
      this.userId
    );
  }

  incrementDownloadCount(): FileEntity {
    return this.incrementCount();
  }

  isPasswordProtected(): boolean {
    return !!this.passwordHash;
  }

  /**
   * Vérifie si le fichier appartient à un utilisateur spécifique
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Vérifie si le fichier a été uploadé de manière anonyme
   */
  isAnonymous(): boolean {
    return !this.userId;
  }

  /**
   * Vérifie si le fichier appartient à un utilisateur connecté
   */
  hasOwner(): boolean {
    return !!this.userId;
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
      userId: this.userId,
    };
  }
}
