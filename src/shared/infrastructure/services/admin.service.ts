/**
 * Admin Service - Admin Domain Bridge
 * 
 * Provides admin operations bridging to the admin domain.
 * Focuses only on admin operations following SRP.
 * 
 * @domain admin
 * @pattern Service Layer (DDD)
 */

import { DomainContainer } from '../di/domain-container';
import { ActionType } from '../../../domains/admin/domain/value-objects/ActionType.vo';

export class AdminService {
  /**
 * Log admin action - bridges to domain
 */
  static async logAdminAction(
    adminId: string,
    actionType: string,
    description: string,
    targetId?: string,
    metadata?: Record<string, any>
  ) {
    const container = DomainContainer.getInstance();
    const logAdminActionUseCase = container.getLogAdminActionUseCase();

    // Convert string to ActionType value object
    const actionTypeVO = ActionType.fromString(actionType);

    // Infer target type from action type or use 'system' as default
    const targetType = actionTypeVO.isFileAction() ? 'file' as const
      : actionTypeVO.isUserAction() ? 'user' as const
        : 'system' as const;

    return await logAdminActionUseCase.execute({
      adminUserId: adminId,
      actionType: actionTypeVO,
      targetType,
      targetId,
      reason: description,
      metadata
    });
  }

  /**
   * Get admin statistics - bridges to domain
   */
  static async getAdminStats() {
    // Placeholder implementation with basic system statistics
    try {
      const { SharedFileModel } = await import('../../../domains/file-sharing/infrastructure/database/shared-file.model');

      // Get basic file statistics
      const [totalFiles, storageStats] = await Promise.all([
        SharedFileModel.countDocuments({ isAvailable: true }),
        SharedFileModel.aggregate([
          { $match: { isAvailable: true } },
          {
            $group: {
              _id: null,
              totalSize: { $sum: '$encryptedSize' },
              totalDownloads: { $sum: '$downloadCount' }
            }
          }
        ])
      ]);

      const stats = storageStats[0] || { totalSize: 0, totalDownloads: 0 };

      return {
        totalFiles: totalFiles || 0,
        totalStorage: this.formatBytes(stats.totalSize || 0),
        totalDownloads: stats.totalDownloads || 0,
        activeUploads: 0, // TODO: Implement real-time upload tracking
        systemStatus: 'operational',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get admin stats:', error);
      return {
        totalFiles: 0,
        totalStorage: '0 B',
        totalDownloads: 0,
        activeUploads: 0,
        systemStatus: 'error',
        timestamp: new Date().toISOString(),
        error: 'Statistics temporarily unavailable'
      };
    }
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
