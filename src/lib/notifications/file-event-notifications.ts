import { saveNotification } from '@/lib/database/models';
import { logSecurityEvent } from '@/lib/audit/audit-service';

export interface FileDownloadNotificationOptions {
  fileId: string;
  filename: string;
  userId?: string;
  downloaderIP: string;
  userAgent: string;
  isPasswordProtected?: boolean;
  downloadCount?: number;
}

export interface FileUploadNotificationOptions {
  fileId: string;
  filename: string;
  userId?: string;
  fileSize: number;
  expiresAt: Date;
  shareUrl: string;
  isZeroKnowledge?: boolean;
  isPasswordProtected?: boolean;
}

export interface FileSharedNotificationOptions {
  fileId: string;
  filename: string;
  userId?: string;
  shareUrl: string;
  sharedVia: 'link' | 'email' | 'social';
}

class FileEventNotificationService {
  
  /**
   * Send notification when a file is downloaded by someone
   */
  async notifyFileDownloaded(options: FileDownloadNotificationOptions): Promise<void> {
    if (!options.userId) {
      // Only send notifications to authenticated users
      return;
    }

    try {
      const downloadCount = options.downloadCount || 1;
      const isFirstDownload = downloadCount === 1;

      await saveNotification({
        userId: options.userId,
        type: 'file_downloaded',
        title: isFirstDownload ? 'File Downloaded' : 'File Downloaded Again',
        message: isFirstDownload 
          ? `Your file "${options.filename}" has been downloaded for the first time.`
          : `Your file "${options.filename}" has been downloaded ${downloadCount} times.`,
        priority: 'normal',
        relatedFileId: options.fileId,
        metadata: {
          fileId: options.fileId,
          filename: options.filename,
          downloaderIP: options.downloaderIP,
          downloadCount,
          isFirstDownload,
          isPasswordProtected: options.isPasswordProtected || false,
          downloadedAt: new Date().toISOString(),
        },
      });

      console.log(`📥 Sent download notification for file ${options.filename} (download #${downloadCount})`);

    } catch (error) {
      console.error('Error sending download notification:', error);
      // Don't throw - notifications shouldn't break file downloads
    }
  }

  /**
   * Send notification when a file is successfully uploaded
   */
  async notifyFileUploaded(options: FileUploadNotificationOptions): Promise<void> {
    if (!options.userId) {
      // Only send notifications to authenticated users
      return;
    }

    try {
      const hoursUntilExpiry = Math.round(
        (options.expiresAt.getTime() - Date.now()) / (60 * 60 * 1000)
      );

      await saveNotification({
        userId: options.userId,
        type: 'file_upload_complete',
        title: options.isZeroKnowledge 
          ? 'Zero-Knowledge File Upload Complete' 
          : 'File Upload Complete',
        message: options.isZeroKnowledge
          ? `Your encrypted file "${options.filename}" has been uploaded successfully with Zero-Knowledge encryption. It will expire in ${hoursUntilExpiry} hours.`
          : `Your file "${options.filename}" has been uploaded successfully. It will expire in ${hoursUntilExpiry} hours.`,
        priority: 'normal',
        relatedFileId: options.fileId,
        actionUrl: options.shareUrl,
        actionLabel: 'View File',
        metadata: {
          fileId: options.fileId,
          filename: options.filename,
          fileSize: options.fileSize,
          expiresAt: options.expiresAt.toISOString(),
          hoursUntilExpiry,
          isZeroKnowledge: options.isZeroKnowledge || false,
          isPasswordProtected: options.isPasswordProtected || false,
          shareUrl: options.shareUrl,
          uploadedAt: new Date().toISOString(),
        },
      });

      console.log(`📤 Sent upload notification for file ${options.filename} (expires in ${hoursUntilExpiry}h)`);

    } catch (error) {
      console.error('Error sending upload notification:', error);
      // Don't throw - notifications shouldn't break file uploads
    }
  }

  /**
   * Send notification when a file is shared
   */
  async notifyFileShared(options: FileSharedNotificationOptions): Promise<void> {
    if (!options.userId) {
      // Only send notifications to authenticated users
      return;
    }

    try {
      await saveNotification({
        userId: options.userId,
        type: 'file_shared',
        title: 'File Share Link Created',
        message: `Share link created for your file "${options.filename}". You can now share this file with others.`,
        priority: 'low',
        relatedFileId: options.fileId,
        actionUrl: options.shareUrl,
        actionLabel: 'View Share Link',
        metadata: {
          fileId: options.fileId,
          filename: options.filename,
          shareUrl: options.shareUrl,
          sharedVia: options.sharedVia,
          sharedAt: new Date().toISOString(),
        },
      });

      console.log(`🔗 Sent share notification for file ${options.filename} via ${options.sharedVia}`);

    } catch (error) {
      console.error('Error sending share notification:', error);
      // Don't throw - notifications shouldn't break file sharing
    }
  }

  /**
   * Send notification when someone attempts to access a password-protected file
   */
  async notifyPasswordAttempt(options: {
    fileId: string;
    filename: string;
    userId?: string;
    success: boolean;
    attemptIP: string;
    userAgent: string;
  }): Promise<void> {
    if (!options.userId) {
      return;
    }

    try {
      await saveNotification({
        userId: options.userId,
        type: 'security_alert',
        title: options.success 
          ? 'Password-Protected File Accessed' 
          : 'Failed Password Attempt on Your File',
        message: options.success
          ? `Someone successfully accessed your password-protected file "${options.filename}".`
          : `Someone attempted to access your password-protected file "${options.filename}" with an incorrect password.`,
        priority: options.success ? 'normal' : 'high',
        relatedFileId: options.fileId,
        metadata: {
          fileId: options.fileId,
          filename: options.filename,
          success: options.success,
          attemptIP: options.attemptIP,
          attemptedAt: new Date().toISOString(),
          securityEvent: true,
        },
      });

      // Also log as security event for monitoring
      await logSecurityEvent(
        options.success ? 'password_access_success' : 'password_access_failed',
        `Password ${options.success ? 'success' : 'failure'} for file ${options.filename}`,
        options.success ? 'low' : 'medium',
        !options.success, // Only blocked if failed
        {
          fileId: options.fileId,
          filename: options.filename,
          success: options.success,
        },
        options.attemptIP
      );

      console.log(`🔐 Sent password attempt notification for file ${options.filename} (${options.success ? 'success' : 'failed'})`);

    } catch (error) {
      console.error('Error sending password attempt notification:', error);
    }
  }
}

// Export singleton instance
export const fileEventNotificationService = new FileEventNotificationService();

// Export class for testing
export { FileEventNotificationService };
