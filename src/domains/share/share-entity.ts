import { randomUUID } from 'crypto';

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
}

export class ShareEntity {
  private constructor(
    public readonly id: string,
    public readonly fileId: string,
    public readonly shareUrl: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly accessCount: number = 0,
    public readonly maxAccess?: number,
    public readonly passwordProtected: boolean = false,
    public readonly passwordHash?: string
  ) {}

  static create(params: {
    fileId: string;
    baseUrl: string;
    expirationHours?: number;
    maxAccess?: number;
    passwordProtected?: boolean;
    passwordHash?: string;
  }): ShareEntity {
    const id = randomUUID();
    const shareUrl = `${params.baseUrl}/share/${id}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + (params.expirationHours || 24) * 60 * 60 * 1000);

    return new ShareEntity(
      id,
      params.fileId,
      shareUrl,
      createdAt,
      expiresAt,
      0,
      params.maxAccess,
      params.passwordProtected || false
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
      metadata.passwordHash
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  hasReachedMaxAccess(): boolean {
    return this.maxAccess !== undefined && this.accessCount >= this.maxAccess;
  }

  canBeAccessed(): boolean {
    return !this.isExpired() && !this.hasReachedMaxAccess();
  }

  incrementAccessCount(): ShareEntity {
    return new ShareEntity(
      this.id,
      this.fileId,
      this.shareUrl,
      this.createdAt,
      this.expiresAt,
      this.accessCount + 1,
      this.maxAccess,
      this.passwordProtected
    );
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
    };
  }
}
