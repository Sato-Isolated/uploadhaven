import { createHash } from 'crypto';
import { AuditLogEntity, AuditAction, AuditLogProps } from './audit-entity';
import { AuditRepository } from './audit-repository';
import { logger } from '@/lib/logger';

export interface AuditContext {
  ip?: string;
  userAgent?: string;
  userId?: string;
}

export interface AuditLogInput {
  action: AuditAction;
  targetId?: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error';
}

export class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  /**
   * Enregistre un log d'audit avec hachage RGPD des données sensibles
   */
  async log(input: AuditLogInput, context: AuditContext): Promise<void> {
    try {
      const ipHash = context.ip ? this.hashIP(context.ip) : 'anonymous';
      
      const auditLog = AuditLogEntity.create({
        action: input.action,
        userId: context.userId,
        targetId: input.targetId,
        ipHash,
        userAgent: context.userAgent,
        metadata: input.metadata,
        severity: input.severity || 'info',
      });

      await this.auditRepository.save(auditLog);

      // Log également dans les logs applicatifs pour debug
      logger.info('Audit log created', {
        id: auditLog.id,
        action: input.action,
        userId: context.userId,
        severity: input.severity || 'info',
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, input, context });
      // Ne pas bloquer l'application si le logging échoue
    }
  }

  /**
   * Récupère les logs d'un utilisateur (pour export RGPD)
   */
  async getUserLogs(userId: string): Promise<AuditLogEntity[]> {
    return this.auditRepository.findByUserId(userId);
  }

  /**
   * Supprime tous les logs d'un utilisateur (pour suppression de compte)
   */
  async deleteUserLogs(userId: string): Promise<number> {
    return this.auditRepository.deleteByUserId(userId);
  }

  /**
   * Nettoie les logs expirés (à exécuter périodiquement)
   */
  async cleanupExpiredLogs(): Promise<number> {
    try {
      const deleted = await this.auditRepository.deleteExpiredLogs();
      logger.info('Cleaned up expired audit logs', { deletedCount: deleted });
      return deleted;
    } catch (error) {
      logger.error('Failed to cleanup expired audit logs', { error });
      return 0;
    }
  }

  /**
   * Hache une adresse IP avec le salt RGPD
   */
  private hashIP(ip: string): string {
    const salt = process.env.IP_HASH_SALT;
    if (!salt) {
      logger.warn('IP_HASH_SALT not configured, using fallback');
      return 'no-salt-configured';
    }
    
    return createHash('sha256')
      .update(ip + salt)
      .digest('hex')
      .substring(0, 16); // Tronquer pour économiser l'espace
  }

  /**
   * Logs d'audit pour l'authentification
   */
  async logAuthEvent(action: 'user.register' | 'user.login' | 'user.logout', userId: string, context: AuditContext): Promise<void> {
    await this.log({
      action,
      severity: 'info',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    }, { ...context, userId });
  }

  /**
   * Logs d'audit pour les fichiers
   */
  async logFileEvent(action: 'file.upload' | 'file.download' | 'file.delete', fileId: string, context: AuditContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      targetId: fileId,
      severity: 'info',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    }, context);
  }

  /**
   * Logs d'audit pour les partages
   */
  async logShareEvent(action: 'share.create' | 'share.access' | 'share.delete', shareId: string, context: AuditContext, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action,
      targetId: shareId,
      severity: 'info',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    }, context);
  }
}
