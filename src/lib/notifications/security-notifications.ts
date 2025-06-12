/**
 * Security notifications utility
 * Handles automatic notification creation for security events
 */

import { saveNotification } from '@/lib/models';
import type { SecurityEventType, SecuritySeverity } from '@/types/events';

interface SecurityNotificationData {
  userId: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  details: string;
  metadata?: Record<string, unknown>;
  relatedFileId?: string;
}

/**
 * Create notifications for critical security events
 */
export async function createSecurityNotification(data: SecurityNotificationData): Promise<void> {
  const { userId, eventType, severity, details, metadata, relatedFileId } = data;

  // Only create notifications for high severity events
  if (severity !== 'high' && severity !== 'critical') {
    return;
  }

  try {
    const notificationConfig = getNotificationConfig(eventType, severity);
    
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
  severity: SecuritySeverity,
  details: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (severity !== 'high' && severity !== 'critical') {
    return;
  }

  const notificationConfig = getNotificationConfig(eventType, severity);
  if (!notificationConfig) {
    return;
  }

  // Create notifications for all users
  const notificationPromises = userIds.map(userId =>
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
    }).catch(error => {
      console.error(`Failed to create security notification for user ${userId}:`, error);
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
function getNotificationConfig(eventType: SecurityEventType, severity: SecuritySeverity): NotificationConfig | null {
  const configs: Partial<Record<SecurityEventType, NotificationConfig>> = {    malware_detected: {
      type: 'malware_detected',
      title: 'Malware Detected',
      priority: 'urgent',
      getMessage: (details, metadata) => {
        const fileName = (metadata?.fileName as string) || 'your file';
        const scanResult = metadata?.scanResult as { threatName?: string } | undefined;
        const threatName = scanResult?.threatName;
        return `Malware detected in ${fileName}${threatName ? ` (${threatName})` : ''}. The file has been flagged for security review.`;
      },
    },
    
    suspicious_activity: {
      type: 'security_alert',
      title: 'Suspicious Activity Detected',
      priority: severity === 'critical' ? 'urgent' : 'high',
      getMessage: (details) => `Suspicious activity has been detected on your account: ${details}`,
    },

    blocked_ip: {
      type: 'security_alert',
      title: 'Security Alert: IP Blocked',
      priority: 'high',
      getMessage: (details, metadata) => {
        const ip = metadata?.ip || 'unknown IP';
        return `Security alert: IP address ${ip} has been blocked due to suspicious activity.`;
      },
    },

    rate_limit: {
      type: 'security_alert', 
      title: 'Rate Limit Exceeded',
      priority: 'high',
      getMessage: (details) => `Rate limit exceeded: ${details}. Please wait before trying again.`,
    },

    invalid_file: {
      type: 'security_alert',
      title: 'Invalid File Upload Detected',
      priority: 'high', 
      getMessage: (details, metadata) => {
        const fileName = metadata?.fileName || 'unknown file';
        return `Invalid file upload detected: ${fileName}. ${details}`;
      },
    },

    access_denied: {
      type: 'security_alert',
      title: 'Unauthorized Access Attempt',
      priority: 'high',
      getMessage: (details) => `Unauthorized access attempt detected: ${details}`,
    },

    system_maintenance: {
      type: 'system_announcement',
      title: 'System Maintenance',
      priority: 'high',
      getMessage: (details) => `System maintenance notification: ${details}`,
    },
  };

  return configs[eventType] || null;
}

/**
 * Create file expiration warning notifications
 */
export async function createFileExpirationNotifications(): Promise<void> {
  try {
    // This would typically be called by a background job
    // Import here to avoid circular dependencies
    const { File } = await import('@/lib/models');

    // Find files expiring in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const expiringFiles = await File.find({
      expiresAt: { 
        $gte: new Date(), 
        $lte: tomorrow 
      },
      userId: { $exists: true, $ne: null },
    }).select('userId originalName expiresAt _id');    const notificationPromises = expiringFiles
      .filter(file => file.userId) // Additional type guard
      .map(async (file) => {
        const hoursLeft = Math.ceil((file.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
        
        return saveNotification({
          userId: file.userId!,
          type: 'file_expired_soon',
          title: 'File Expiring Soon',
          message: `Your file "${file.originalName}" will expire in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}. Download or extend the expiration if needed.`,
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
