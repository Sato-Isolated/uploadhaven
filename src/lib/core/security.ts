// Security utilities for logging and monitoring security events
import type {
  SecurityEventType,
  SecuritySeverity,
  SecurityStats as BaseSecurityStats,
} from '@/types';

// Compatible SecurityEvent interface for lib usage
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: number | string | Date; // Flexible timestamp format
  ip: string;
  details: string;
  severity: SecuritySeverity;
  userAgent?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
}

export type SecurityStats = BaseSecurityStats;

class SecurityLogger {
  private static instance: SecurityLogger;
  private events: SecurityEvent[] = [];
  private eventListeners: ((event: SecurityEvent) => void)[] = [];

  private constructor() {
    this.loadEvents();
  }

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  private loadEvents() {
    if (typeof window !== 'undefined') {
      try {
        const savedEvents = localStorage.getItem('securityEvents');
        this.events = savedEvents ? JSON.parse(savedEvents) : [];
      } catch {
        // Failed to load security events - fall back to empty array
        this.events = [];
      }
    }
  }
  private saveEvents() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('securityEvents', JSON.stringify(this.events));
      } catch {
        // Failed to save security events - ignore silently
      }
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getUserIP(): string {
    // In a real implementation, this would get the actual IP
    // For demo purposes, we'll use a simulated IP
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    return typeof window !== 'undefined'
      ? window.navigator.userAgent
      : 'Unknown';
  }

  public logEvent(
    type: SecurityEvent['type'],
    details: string,
    severity: SecurityEvent['severity'] = 'low',
    additionalData?: {
      filename?: string;
      fileSize?: number;
      fileType?: string;
      ip?: string;
    }
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      ip: additionalData?.ip || this.getUserIP(),
      details,
      severity,
      userAgent: this.getUserAgent(),
      filename: additionalData?.filename,
      fileSize: additionalData?.fileSize,
      fileType: additionalData?.fileType,
    };

    this.events.unshift(event); // Add to beginning for chronological order

    // Keep only last 1000 events to prevent localStorage overflow
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }

    this.saveEvents();

    // Notify listeners
    this.eventListeners.forEach((listener) => listener(event));

    return event;
  }

  public getEvents(): SecurityEvent[] {
    return [...this.events];
  }
  public getStats(): SecurityStats {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const getTimestamp = (event: SecurityEvent): number => {
      if (typeof event.timestamp === 'number') return event.timestamp;
      if (event.timestamp instanceof Date) return event.timestamp.getTime();
      return new Date(event.timestamp).getTime();
    };    return {
      totalEvents: this.events.length,
      rateLimitHits: this.events.filter((e) => e.type === 'rate_limit').length,
      invalidFiles: this.events.filter((e) => e.type === 'invalid_file').length,
      blockedIPs: new Set(
        this.events.filter((e) => e.type === 'blocked_ip').map((e) => e.ip)
      ).size,
      last24h: this.events.filter((e) => getTimestamp(e) > last24h).length,
      largeSizeBlocked: this.events.filter((e) => e.type === 'large_file')
        .length,
    };
  }

  public addEventListener(listener: (event: SecurityEvent) => void) {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (event: SecurityEvent) => void) {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();

// Convenience function for logging security events
export function logSecurityEvent(
  type: SecurityEvent['type'],
  details: string,
  severity: SecurityEvent['severity'] = 'low',
  additionalData?: {
    filename?: string;
    fileSize?: number;
    fileType?: string;
    ip?: string;
  }
): SecurityEvent {
  return securityLogger.logEvent(type, details, severity, additionalData);
}

// Detect suspicious activity patterns
export function detectSuspiciousActivity(ip: string): boolean {
  const events = securityLogger.getEvents();

  const getTimestamp = (event: SecurityEvent): number => {
    if (typeof event.timestamp === 'number') return event.timestamp;
    if (event.timestamp instanceof Date) return event.timestamp.getTime();
    return new Date(event.timestamp).getTime();
  };

  const recentEvents = events.filter(
    (event) =>
      event.ip === ip && Date.now() - getTimestamp(event) < 5 * 60 * 1000 // Last 5 minutes
  );

  // Flag as suspicious if more than 10 events from same IP in 5 minutes
  if (recentEvents.length > 10) {
    logSecurityEvent(
      'suspicious_activity',
      `High activity from IP: ${ip}`,
      'medium',
      { ip }
    );
    return true;
  }

  return false;
}
