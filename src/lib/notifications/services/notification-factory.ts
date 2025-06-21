/**
 * Notification Factory
 * Creates different types of notifications with appropriate defaults and templates
 */

import type {
  CreateNotificationData,
  NotificationType,
  NotificationPriority,
} from '../domain/types';
import { getNotificationConfig, getDefaultExpirationDate } from '../domain/constants';

// =============================================================================
// Notification Templates
// =============================================================================

interface NotificationTemplate {
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
}

interface FileNotificationContext {
  fileName: string;
  fileId: string;
  downloadCount?: number;
  expiresAt?: Date;
  downloaderIp?: string;
}

interface SecurityNotificationContext {
  eventType: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

interface SystemNotificationContext {
  announcementTitle: string;
  details: string;
  actionRequired?: boolean;
  maintenanceWindow?: { start: Date; end: Date };
}

interface BulkNotificationContext {
  operationType: 'delete' | 'archive' | 'download';
  itemCount: number;
  successCount: number;
  failureCount: number;
}

// =============================================================================
// Factory Class
// =============================================================================

export class NotificationFactory {
  /**
   * Create file downloaded notification
   */
  public static createFileDownloadedNotification(
    userId: string,
    context: FileNotificationContext
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: 'File Downloaded',
      message: `Your file "${context.fileName}" has been downloaded${
        context.downloadCount ? ` (${context.downloadCount} times)` : ''
      }.`,
      actionUrl: `/dashboard/files/${context.fileId}`,
      actionLabel: 'View File',
    };

    return this.createFromTemplate('file_downloaded', userId, template, {
      relatedFileId: context.fileId,
      metadata: {
        fileName: context.fileName,
        downloadCount: context.downloadCount,
        downloaderIp: context.downloaderIp,
      },
    });
  }

  /**
   * Create file expiring soon notification
   */
  public static createFileExpiringSoonNotification(
    userId: string,
    context: FileNotificationContext & { hoursUntilExpiration: number }
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: 'File Expiring Soon',
      message: `Your file "${context.fileName}" will expire in ${context.hoursUntilExpiration} hours.`,
      priority: 'high',
      actionUrl: `/dashboard/files/${context.fileId}`,
      actionLabel: 'Extend Expiration',
    };

    return this.createFromTemplate('file_expired_soon', userId, template, {
      relatedFileId: context.fileId,
      metadata: {
        fileName: context.fileName,
        hoursUntilExpiration: context.hoursUntilExpiration,
        expiresAt: context.expiresAt?.toISOString(),
      },
    });
  }

  /**
   * Create file shared notification
   */
  public static createFileSharedNotification(
    userId: string,
    context: FileNotificationContext & { shareUrl: string }
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: 'File Shared Successfully',
      message: `Your file "${context.fileName}" has been shared and is ready for download.`,
      actionUrl: context.shareUrl,
      actionLabel: 'View Share Link',
    };

    return this.createFromTemplate('file_shared', userId, template, {
      relatedFileId: context.fileId,
      metadata: {
        fileName: context.fileName,
        shareUrl: context.shareUrl,
      },
    });
  }

  /**
   * Create file upload complete notification
   */
  public static createFileUploadCompleteNotification(
    userId: string,
    context: FileNotificationContext & { shareUrl: string; isEncrypted: boolean }
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: 'Upload Complete',
      message: `Your file "${context.fileName}" has been uploaded successfully${
        context.isEncrypted ? ' with zero-knowledge encryption' : ''
      }.`,
      actionUrl: context.shareUrl,
      actionLabel: 'View File',
    };

    return this.createFromTemplate('file_upload_complete', userId, template, {
      relatedFileId: context.fileId,
      metadata: {
        fileName: context.fileName,
        shareUrl: context.shareUrl,
        isEncrypted: context.isEncrypted,
      },
    });
  }

  /**
   * Create security alert notification
   */
  public static createSecurityAlertNotification(
    userId: string,
    context: SecurityNotificationContext
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: 'Security Alert',
      message: `Security event detected: ${context.eventType}. ${context.details}`,
      priority: 'urgent',
      actionUrl: '/dashboard/security',
      actionLabel: 'Review Security',
    };

    return this.createFromTemplate('security_alert', userId, template, {
      metadata: {
        eventType: context.eventType,
        details: context.details,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: context.timestamp?.toISOString(),
      },
    });
  }

  /**
   * Create malware detected notification
   */
  public static createMalwareDetectedNotification(
    userId: string,
    context: FileNotificationContext & { scanResult: string }
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: 'Malware Detected',
      message: `Malware was detected in your file "${context.fileName}" and it has been quarantined for your security.`,
      priority: 'urgent',
      actionUrl: '/dashboard/security',
      actionLabel: 'View Security Report',
    };

    return this.createFromTemplate('malware_detected', userId, template, {
      relatedFileId: context.fileId,
      metadata: {
        fileName: context.fileName,
        scanResult: context.scanResult,
        quarantined: true,
      },
    });
  }

  /**
   * Create account security notification
   */
  public static createAccountSecurityNotification(
    userId: string,
    context: SecurityNotificationContext & { actionType: 'password_change' | 'login_attempt' | 'account_locked' }
  ): CreateNotificationData {
    const titles = {
      password_change: 'Password Changed',
      login_attempt: 'Suspicious Login Attempt',
      account_locked: 'Account Temporarily Locked',
    };

    const messages = {
      password_change: `Your account password was changed successfully.`,
      login_attempt: `A suspicious login attempt was detected on your account.`,
      account_locked: `Your account has been temporarily locked due to suspicious activity.`,
    };

    const template: NotificationTemplate = {
      title: titles[context.actionType],
      message: `${messages[context.actionType]} ${context.details}`,
      priority: context.actionType === 'password_change' ? 'normal' : 'high',
      actionUrl: '/dashboard/security',
      actionLabel: 'Review Account Security',
    };

    return this.createFromTemplate('account_security', userId, template, {
      metadata: {
        actionType: context.actionType,
        details: context.details,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: context.timestamp?.toISOString(),
      },
    });
  }

  /**
   * Create system announcement notification
   */
  public static createSystemAnnouncementNotification(
    userId: string,
    context: SystemNotificationContext
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: context.announcementTitle,
      message: context.details,
      priority: context.actionRequired ? 'high' : 'normal',
      actionUrl: context.actionRequired ? '/dashboard' : undefined,
      actionLabel: context.actionRequired ? 'Take Action' : undefined,
    };

    return this.createFromTemplate('system_announcement', userId, template, {
      metadata: {
        announcementTitle: context.announcementTitle,
        actionRequired: context.actionRequired,
        maintenanceWindow: context.maintenanceWindow,
      },
    });
  }

  /**
   * Create admin alert notification
   */
  public static createAdminAlertNotification(
    userId: string,
    context: { alertType: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: `Admin Alert: ${context.alertType}`,
      message: context.message,
      priority: context.severity === 'critical' || context.severity === 'high' ? 'urgent' : 'high',
      actionUrl: '/admin/alerts',
      actionLabel: 'View Admin Panel',
    };

    return this.createFromTemplate('admin_alert', userId, template, {
      metadata: {
        alertType: context.alertType,
        severity: context.severity,
      },
    });
  }

  /**
   * Create bulk action complete notification
   */
  public static createBulkActionCompleteNotification(
    userId: string,
    context: BulkNotificationContext
  ): CreateNotificationData {
    const template: NotificationTemplate = {
      title: 'Bulk Action Complete',
      message: `${context.operationType} operation completed. ${context.successCount} items processed successfully${
        context.failureCount > 0 ? `, ${context.failureCount} items failed` : ''
      }.`,
      priority: context.failureCount > 0 ? 'high' : 'normal',
      actionUrl: '/dashboard',
      actionLabel: 'View Dashboard',
    };

    return this.createFromTemplate('bulk_action_complete', userId, template, {
      metadata: {
        operationType: context.operationType,
        itemCount: context.itemCount,
        successCount: context.successCount,
        failureCount: context.failureCount,
      },
    });
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Create notification from template
   */
  private static createFromTemplate(
    type: NotificationType,
    userId: string,
    template: NotificationTemplate,
    options: {
      relatedFileId?: string;
      metadata?: Record<string, unknown>;
      expiresAt?: Date;
    } = {}
  ): CreateNotificationData {
    const config = getNotificationConfig(type);

    return {
      userId,
      type,
      title: template.title,
      message: template.message,
      priority: template.priority || config.priority,
      relatedFileId: options.relatedFileId,
      actionUrl: template.actionUrl,
      actionLabel: template.actionLabel,
      expiresAt: options.expiresAt || getDefaultExpirationDate(type),
      metadata: {
        ...options.metadata,
        templateUsed: true,
        notificationConfig: {
          icon: config.icon,
          color: config.color,
          category: config.category,
        },
      },
    };
  }

  /**
   * Create custom notification (for advanced use cases)
   */
  public static createCustomNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options: {
      priority?: NotificationPriority;
      relatedFileId?: string;
      actionUrl?: string;
      actionLabel?: string;
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    } = {}
  ): CreateNotificationData {
    const config = getNotificationConfig(type);

    return {
      userId,
      type,
      title,
      message,
      priority: options.priority || config.priority,
      relatedFileId: options.relatedFileId,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      expiresAt: options.expiresAt || getDefaultExpirationDate(type),
      metadata: {
        ...options.metadata,
        customNotification: true,
        notificationConfig: {
          icon: config.icon,
          color: config.color,
          category: config.category,
        },
      },
    };
  }
}
