import { BaseEntity, BaseCreateParams, Expirable, Countable, EntityUtils } from '../shared';

export interface ShareMetadata {
  id: string;
  fileId: string;
  shareUrl: string;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  maxAccess?: number;
  passwordProtected: boolean;
  passwordHash?: string;
  userId?: string; // User ID if share was created by authenticated user
}

export interface ShareCreateParams extends BaseCreateParams {
  fileId: string;
  baseUrl: string;
  maxAccess?: number;
  passwordProtected?: boolean;
  passwordHash?: string;
  userId?: string; // User ID if share was created by authenticated user
}

export class ShareEntity implements BaseEntity, Expirable, Countable<ShareEntity> {
  private constructor(
    public readonly id: string,
    public readonly fileId: string,
    public readonly shareUrl: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly accessCount: number = 0,
    public readonly maxAccess?: number,
    public readonly passwordProtected: boolean = false,
    public readonly passwordHash?: string,
    public readonly userId?: string
  ) {}

  // Alias pour l'interface Countable
  get count(): number {
    return this.accessCount;
  }

  get maxCount(): number | undefined {
    return this.maxAccess;
  }

  static create(params: ShareCreateParams): ShareEntity {
    const id = EntityUtils.generateId();
    const shareUrl = `${params.baseUrl}/share/${id}`;
    const createdAt = new Date();
    const expiresAt = EntityUtils.calculateExpirationDate(params.expirationHours);

    return new ShareEntity(
      id,
      params.fileId,
      shareUrl,
      createdAt,
      expiresAt,
      0,
      params.maxAccess,
      params.passwordProtected || false,
      params.passwordHash,
      params.userId
    );
  }

  static fromMetadata(metadata: ShareMetadata): ShareEntity {
    return new ShareEntity(
      metadata.id,
      metadata.fileId,
      metadata.shareUrl,
      metadata.createdAt,
      metadata.expiresAt,
      metadata.accessCount,
      metadata.maxAccess,
      metadata.passwordProtected,
      metadata.passwordHash,
      metadata.userId
    );
  }

  isExpired(): boolean {
    return EntityUtils.isExpired(this.expiresAt);
  }

  hasReachedMaxCount(): boolean {
    return this.maxAccess !== undefined && this.accessCount >= this.maxAccess;
  }

  hasReachedMaxAccess(): boolean {
    return this.hasReachedMaxCount();
  }

  canBeAccessed(): boolean {
    return !this.isExpired() && !this.hasReachedMaxCount();
  }

  incrementCount(): ShareEntity {
    return new ShareEntity(
      this.id,
      this.fileId,
      this.shareUrl,
      this.createdAt,
      this.expiresAt,
      this.accessCount + 1,
      this.maxAccess,
      this.passwordProtected,
      this.passwordHash,
      this.userId
    );
  }

  incrementAccessCount(): ShareEntity {
    return this.incrementCount();
  }

  /**
   * Vérifie si le partage appartient à un utilisateur spécifique
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Vérifie si le partage a été créé de manière anonyme
   */
  isAnonymous(): boolean {
    return !this.userId;
  }

  /**
   * Vérifie si le partage appartient à un utilisateur connecté
   */
  hasOwner(): boolean {
    return !!this.userId;
  }

  toMetadata(): ShareMetadata {
    return {
      id: this.id,
      fileId: this.fileId,
      shareUrl: this.shareUrl,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      accessCount: this.accessCount,
      maxAccess: this.maxAccess,
      passwordProtected: this.passwordProtected,
      passwordHash: this.passwordHash,
      userId: this.userId,
    };
  }
}
