import { BaseRepository } from '@/domains/shared/base-repository';
import { AuditLogEntity, AuditAction } from './audit-entity';

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  severity?: 'info' | 'warning' | 'error';
  startDate?: Date;
  endDate?: Date;
}

export interface AuditRepository extends BaseRepository<AuditLogEntity> {
  findByUserId(userId: string): Promise<AuditLogEntity[]>;
  findByFilters(filters: AuditLogFilters, limit?: number): Promise<AuditLogEntity[]>;
  deleteExpiredLogs(): Promise<number>;
  countByUserId(userId: string): Promise<number>;
  deleteByUserId(userId: string): Promise<number>;
}
