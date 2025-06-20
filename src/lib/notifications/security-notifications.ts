/**
 * Security notifications utility
 * Handles automatic notification creation for security events
 */

import { saveNotification } from '@/lib/database/models';
import type { AuditSeverity } from '@/types/audit';

type SecurityEventType = 
  | 'suspicious_activity'
  | 'blocked_ip'
  | 'rate_limit'
  | 'invalid_file'
  | 'access_denied'
  | 'system_maintenance';

interface SecurityNotificationData {
  userId: string;
  eventType: SecurityEventType;
  severity: AuditSeverity;
  details: string;
  metadata?: Record<string, unknown>;
  relatedFileId?: string;
}

type TranslationFunction = (
  key: string,
  params?: Record<string, any>
) => string;

/**
 * Create notifications for critical security events
 */
export async function createSecurityNotification(
  data: SecurityNotificationData,
  t?: TranslationFunction
): Promise<void> {
  const { userId, eventType, severity, details, metadata, relatedFileId } =
    data;

  // Only create notifications for high severity events
  if (severity !== 'high' && severity !== 'critical') {
    return;
  }

  try {
    const notificationConfig = getNotificationConfig(eventType, severity, t);

    if (!notificationConfig) {
      return; // No notification needed for this event type
    }

    await saveNotification({
      userId,
      type: notificationConfig.type,
      title: notificationConfig.title,
      message: notificationConfig.getMessage(details, metadata),
      priority: notificationConfig.priority,
      relatedFileId,
      metadata: {
        securityEvent: {
          type: eventType,
          severity,
          details,
          timestamp: new Date().toISOString(),
        },
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Failed to create security notification:', error);
    // Don't throw - security notifications shouldn't break the main flow
  }
}

/**
 * Bulk create notifications for multiple users for system-wide security events
 */
export async function createSystemSecurityNotification(
  userIds: string[],
  eventType: SecurityEventType,
  severity: AuditSeverity,
  details: string,
  metadata?: Record<string, unknown>,
  t?: TranslationFunction
): Promise<void> {
  if (severity !== 'high' && severity !== 'critical') {
    return;
  }

  const notificationConfig = getNotificationConfig(eventType, severity, t);
  if (!notificationConfig) {
    return;
  }

  // Create notifications for all users
  const notificationPromises = userIds.map((userId) =>
    saveNotification({
      userId,
      type: notificationConfig.type,
      title: notificationConfig.title,
      message: notificationConfig.getMessage(details, metadata),
      priority: notificationConfig.priority,
      metadata: {
        securityEvent: {
          type: eventType,
          severity,
          details,
          timestamp: new Date().toISOString(),
        },
        ...metadata,
      },
    }).catch((error) => {
      console.error(
        `Failed to create security notification for user ${userId}:`,
        error
      );
      // Continue with other users even if one fails
    })
  );

  await Promise.allSettled(notificationPromises);
}

interface NotificationConfig {
  type: string;
  title: string;
  priority: 'high' | 'urgent';
  getMessage: (details: string, metadata?: Record<string, unknown>) => string;
}

/**
 * Get notification configuration for security event types
 */
function getNotificationConfig(
  eventType: SecurityEventType,
  severity: AuditSeverity,
  t?: TranslationFunction
): NotificationConfig | null {
  // Fallback function for when no translation function is provided
  const translate =
    t ||    ((key: string, params?: Record<string, any>) => {
      // Fallback to English strings if no translation function provided
      const fallbacks: Record<string, string> = {
        'SecurityNotifications.suspiciousActivityDetected':
          'Suspicious Activity Detected',
        'SecurityNotifications.suspiciousActivityMessage':
          'Suspicious activity has been detected on your account: {details}',
        'SecurityNotifications.securityAlertIpBlocked':
          'Security Alert: IP Blocked',
        'SecurityNotifications.ipBlockedMessage':
          'Security alert: IP address {ip} has been blocked due to suspicious activity.',
        'SecurityNotifications.rateLimitExceeded': 'Rate Limit Exceeded',
        'SecurityNotifications.rateLimitMessage':
          'Rate limit exceeded: {details}. Please wait before trying again.',
        'SecurityNotifications.invalidFileUploadDetected':
          'Invalid File Upload Detected',
        'SecurityNotifications.invalidFileMessage':
          'Invalid file upload detected: {fileName}. {details}',
        'SecurityNotifications.unauthorizedAccessAttempt':
          'Unauthorized Access Attempt',
        'SecurityNotifications.unauthorizedAccessMessage':
          'Unauthorized access attempt detected: {details}',
        'SecurityNotifications.systemMaintenance': 'System Maintenance',
        'SecurityNotifications.systemMaintenanceMessage':
          'System maintenance notification: {details}',
        'SecurityNotifications.threatNamePrefix': ' ({threatName})',
        'SecurityNotifications.unknownFile': 'unknown file',
        'SecurityNotifications.unknownIp': 'unknown IP',
      };
      let message = fallbacks[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          message = message.replace(`{${paramKey}}`, String(value));
        });
      }
      return message;
    });
  const configs: Partial<Record<SecurityEventType, NotificationConfig>> = {
    suspicious_activity: {
      type: 'security_alert',
      title: translate('SecurityNotifications.suspiciousActivityDetected'),
      priority: severity === 'critical' ? 'urgent' : 'high',
      getMessage: (details) =>
        translate('SecurityNotifications.suspiciousActivityMessage', {
          details,
        }),
    },

    blocked_ip: {
      type: 'security_alert',
      title: translate('SecurityNotifications.securityAlertIpBlocked'),
      priority: 'high',
      getMessage: (details, metadata) => {
        const ip = metadata?.ip || translate('SecurityNotifications.unknownIp');
        return translate('SecurityNotifications.ipBlockedMessage', { ip });
      },
    },

    rate_limit: {
      type: 'security_alert',
      title: translate('SecurityNotifications.rateLimitExceeded'),
      priority: 'high',
      getMessage: (details) =>
        translate('SecurityNotifications.rateLimitMessage', { details }),
    },

    invalid_file: {
      type: 'security_alert',
      title: translate('SecurityNotifications.invalidFileUploadDetected'),
      priority: 'high',
      getMessage: (details, metadata) => {
        const fileName =
          metadata?.fileName || translate('SecurityNotifications.unknownFile');
        return translate('SecurityNotifications.invalidFileMessage', {
          fileName,
          details,
        });
      },
    },

    access_denied: {
      type: 'security_alert',
      title: translate('SecurityNotifications.unauthorizedAccessAttempt'),
      priority: 'high',
      getMessage: (details) =>
        translate('SecurityNotifications.unauthorizedAccessMessage', {
          details,
        }),
    },

    system_maintenance: {
      type: 'system_announcement',
      title: translate('SecurityNotifications.systemMaintenance'),
      priority: 'high',
      getMessage: (details) =>
        translate('SecurityNotifications.systemMaintenanceMessage', {
          details,
        }),
    },
  };

  return configs[eventType] || null;
}

/**
 * Create file expiration warning notifications
 */
export async function createFileExpirationNotifications(
  t?: TranslationFunction
): Promise<void> {
  try {
    // This would typically be called by a background job
    // Import here to avoid circular dependencies
    const { File } = await import('@/lib/database/models');

    // Find files expiring in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringFiles = await File.find({
      expiresAt: {
        $gte: new Date(),
        $lte: tomorrow,
      },
      userId: { $exists: true, $ne: null },
    }).select('userId originalName expiresAt _id');

    // Fallback translation function
    const translate =
      t ||
      ((key: string, params?: Record<string, any>) => {
        const fallbacks: Record<string, string> = {
          'SecurityNotifications.fileExpiringSoon': 'File Expiring Soon',
          'SecurityNotifications.fileExpiringMessage':
            'Your file "{fileName}" will expire in {hoursLeft} hour{plural}. Download or extend the expiration if needed.',
        };
        let message = fallbacks[key] || key;
        if (params) {
          Object.entries(params).forEach(([paramKey, value]) => {
            message = message.replace(`{${paramKey}}`, String(value));
          });
        }
        return message;
      });

    const notificationPromises = expiringFiles
      .filter((file) => file.userId) // Additional type guard
      .map(async (file) => {
        const hoursLeft = Math.ceil(
          (file.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
        );

        const plural = hoursLeft !== 1 ? 's' : '';

        return saveNotification({
          userId: file.userId!,
          type: 'file_expired_soon',
          title: translate('SecurityNotifications.fileExpiringSoon'),
          message: translate('SecurityNotifications.fileExpiringMessage', {
            fileName: file.originalName,
            hoursLeft,
            plural,
          }),
          priority: hoursLeft <= 2 ? 'high' : 'normal',
          relatedFileId: file._id.toString(),
          metadata: {
            fileName: file.originalName,
            expiresAt: file.expiresAt.toISOString(),
            hoursLeft,
          },
        });
      });

    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error('Failed to create file expiration notifications:', error);
  }
}
