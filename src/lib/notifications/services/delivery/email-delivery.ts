/**
 * Email Delivery Service - Focused notification delivery via email
 * 
 * Single Responsibility: Handle email-based notification delivery
 * - Formats notifications for email delivery
 * - Manages email templates and content
 * - Handles delivery tracking and error handling
 * - Supports batching for multiple recipients
 */

import type { Notification } from '@/types/events';

interface EmailDeliveryOptions {
  to: string[];
  subject?: string;
  template?: 'default' | 'security' | 'digest';
  batchSize?: number;
  priority?: 'low' | 'normal' | 'high';
}

interface EmailDeliveryResult {
  success: boolean;
  deliveredCount: number;
  failedCount: number;
  errors: string[];
}

export class EmailDeliveryService {
  private readonly emailService: any; // TODO: Replace with actual email service
  private readonly templates: Map<string, EmailTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Send single notification via email
   */
  async sendNotification(
    notification: Notification,
    options: EmailDeliveryOptions
  ): Promise<EmailDeliveryResult> {
    try {
      const emailContent = this.formatNotificationForEmail(notification, options.template);
      
      const result = await this.sendEmail({
        to: options.to,
        subject: options.subject || this.generateSubject(notification),
        content: emailContent,
        priority: options.priority || 'normal',
      });

      return {
        success: result.success,
        deliveredCount: result.success ? options.to.length : 0,
        failedCount: result.success ? 0 : options.to.length,
        errors: result.success ? [] : [result.error || 'Unknown error'],
      };
    } catch (error) {
      return {
        success: false,
        deliveredCount: 0,
        failedCount: options.to.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Send multiple notifications in batch
   */
  async sendBatch(
    notifications: Notification[],
    options: EmailDeliveryOptions
  ): Promise<EmailDeliveryResult> {
    const batchSize = options.batchSize || 10;
    const results: EmailDeliveryResult[] = [];

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const batchResult = await this.sendNotificationBatch(batch, options);
      results.push(batchResult);
    }

    return this.aggregateResults(results);
  }

  /**
   * Send digest email with multiple notifications
   */
  async sendDigest(
    notifications: Notification[],
    options: EmailDeliveryOptions
  ): Promise<EmailDeliveryResult> {
    try {
      const digestContent = this.formatDigestForEmail(notifications);
      
      const result = await this.sendEmail({
        to: options.to,
        subject: options.subject || this.generateDigestSubject(notifications),
        content: digestContent,
        priority: options.priority || 'normal',
      });

      return {
        success: result.success,
        deliveredCount: result.success ? options.to.length : 0,
        failedCount: result.success ? 0 : options.to.length,
        errors: result.success ? [] : [result.error || 'Unknown error'],
      };
    } catch (error) {
      return {
        success: false,
        deliveredCount: 0,
        failedCount: options.to.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private initializeTemplates(): void {
    this.templates.set('default', {
      subject: '[UploadHaven] {{title}}',
      body: `
        <h2>{{title}}</h2>
        <p>{{message}}</p>
        {{#if actionUrl}}
        <p><a href="{{actionUrl}}" style="background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">{{actionLabel}}</a></p>
        {{/if}}
        <hr>
        <p style="color: #666; font-size: 12px;">Priority: {{priority}} | Type: {{type}}</p>
      `,
    });

    this.templates.set('security', {
      subject: '[SECURITY ALERT] {{title}}',
      body: `
        <div style="border-left: 4px solid #ef4444; padding: 12px; background: #fef2f2;">
          <h2 style="color: #dc2626;">🚨 Security Alert</h2>
          <p><strong>{{title}}</strong></p>
          <p>{{message}}</p>
          {{#if actionUrl}}
          <p><a href="{{actionUrl}}" style="background: #dc2626; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">{{actionLabel}}</a></p>
          {{/if}}
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated security notification from UploadHaven.</p>
        </div>
      `,
    });

    this.templates.set('digest', {
      subject: '[UploadHaven] Daily Notification Digest',
      body: `
        <h2>Your Daily Notifications</h2>
        <p>Here's a summary of your recent notifications:</p>
        {{#each notifications}}
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
          <h3>{{title}}</h3>
          <p>{{message}}</p>
          <p style="color: #666; font-size: 12px;">{{createdAt}} | Priority: {{priority}}</p>
        </div>
        {{/each}}
      `,
    });
  }

  private formatNotificationForEmail(
    notification: Notification,
    templateName: string = 'default'
  ): string {
    const template = this.templates.get(templateName) || this.templates.get('default')!;
    
    // Simple template substitution (in production, use a proper template engine)
    return template.body
      .replace(/\{\{title\}\}/g, notification.title)
      .replace(/\{\{message\}\}/g, notification.message)
      .replace(/\{\{priority\}\}/g, notification.priority)
      .replace(/\{\{type\}\}/g, notification.type)
      .replace(/\{\{actionUrl\}\}/g, notification.actionUrl || '')
      .replace(/\{\{actionLabel\}\}/g, notification.actionLabel || 'View Details');
  }

  private formatDigestForEmail(notifications: Notification[]): string {
    const template = this.templates.get('digest')!;
    
    const notificationList = notifications
      .map(n => `
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
          <h3>${n.title}</h3>
          <p>${n.message}</p>
          <p style="color: #666; font-size: 12px;">${new Date(n.createdAt).toLocaleString()} | Priority: ${n.priority}</p>
        </div>
      `)
      .join('');

    return template.body.replace(/\{\{#each notifications\}\}[\s\S]*?\{\{\/each\}\}/g, notificationList);
  }

  private generateSubject(notification: Notification): string {
    const template = this.getTemplateForNotification(notification);
    return template.subject.replace(/\{\{title\}\}/g, notification.title);
  }

  private generateDigestSubject(notifications: Notification[]): string {
    const count = notifications.length;
    const hasUrgent = notifications.some(n => n.priority === 'urgent');
    
    if (hasUrgent) {
      return `[UploadHaven] ${count} notifications including urgent alerts`;
    }
    
    return `[UploadHaven] ${count} new notifications`;
  }

  private getTemplateForNotification(notification: Notification): EmailTemplate {
    if (notification.type === 'security_alert') {
      return this.templates.get('security')!;
    }
    return this.templates.get('default')!;
  }

  private async sendEmail(params: {
    to: string[];
    subject: string;
    content: string;
    priority: string;
  }): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement actual email sending logic
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    
    console.log('Email would be sent:', {
      to: params.to,
      subject: params.subject,
      priority: params.priority,
    });

    // Simulate email sending
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  }

  private async sendNotificationBatch(
    notifications: Notification[],
    options: EmailDeliveryOptions
  ): Promise<EmailDeliveryResult> {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification, options))
    );

    return this.aggregateResults(
      results.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : { success: false, deliveredCount: 0, failedCount: 1, errors: ['Batch send failed'] }
      )
    );
  }

  private aggregateResults(results: EmailDeliveryResult[]): EmailDeliveryResult {
    return results.reduce(
      (acc, result) => ({
        success: acc.success && result.success,
        deliveredCount: acc.deliveredCount + result.deliveredCount,
        failedCount: acc.failedCount + result.failedCount,
        errors: [...acc.errors, ...result.errors],
      }),
      { success: true, deliveredCount: 0, failedCount: 0, errors: [] }
    );
  }
}

interface EmailTemplate {
  subject: string;
  body: string;
}

export default EmailDeliveryService;
