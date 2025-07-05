import { BaseEntity, EntityUtils } from '@/domains/shared/base-entity';

export type AuditAction = 
  | 'user.register'
  | 'user.login'
  | 'user.logout'
  | 'user.update'
  | 'user.delete'
  | 'file.upload'
  | 'file.download'
  | 'file.delete'
  | 'file.preview'
  | 'share.create'
  | 'share.access'
  | 'share.delete'
  | 'admin.action';

export interface AuditLogProps {
  action: AuditAction;
  userId?: string; // null pour les actions anonymes
  targetId?: string; // ID du fichier/share concerné
  ipHash: string; // IP hashée pour RGPD
  userAgent?: string;
  metadata?: Record<string, any>; // données additionnelles
  severity: 'info' | 'warning' | 'error';
}

export class AuditLogEntity implements BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  private props: AuditLogProps;

  constructor(props: AuditLogProps, id?: string, createdAt?: Date, expiresAt?: Date) {
    this.id = id || EntityUtils.generateId();
    this.createdAt = createdAt || new Date();
    // Logs gardés 1 an par défaut (365 jours)
    this.expiresAt = expiresAt || EntityUtils.calculateExpirationDate(24 * 365);
    this.props = { ...props };
  }

  static create(props: AuditLogProps, id?: string): AuditLogEntity {
    return new AuditLogEntity(props, id);
  }

  get action(): AuditAction {
    return this.props.action;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get targetId(): string | undefined {
    return this.props.targetId;
  }

  get ipHash(): string {
    return this.props.ipHash;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  get severity(): 'info' | 'warning' | 'error' {
    return this.props.severity;
  }

  get isExpired(): boolean {
    return EntityUtils.isExpired(this.expiresAt);
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      ...this.props,
    };
  }
}
