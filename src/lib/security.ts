// Security utilities for logging and monitoring security events
export interface SecurityEvent {
  id: string;
  type:
    | "rate_limit"
    | "invalid_file"
    | "large_file"
    | "blocked_ip"
    | "suspicious_activity"
    | "file_scan"
    | "malware_detected"
    | "file_upload"
    | "user_registration"
    | "file_download"
    | "user_login"
    | "user_logout"
    | "system_maintenance";
  timestamp: number;
  ip: string;
  details: string;
  severity: "low" | "medium" | "high";
  userAgent?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
}

export interface SecurityStats {
  totalEvents: number;
  rateLimitHits: number;
  invalidFiles: number;
  blockedIPs: number;
  last24h: number;
  malwareDetected: number;
  largeSizeBlocked: number;
}

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

  private loadEvents() {    if (typeof window !== "undefined") {      try {
        const savedEvents = localStorage.getItem("securityEvents");
        this.events = savedEvents ? JSON.parse(savedEvents) : [];
      } catch {
        // Failed to load security events - fall back to empty array
        this.events = [];
      }
    }
  }
  private saveEvents() {
    if (typeof window !== "undefined") {      try {
        localStorage.setItem("securityEvents", JSON.stringify(this.events));
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
    return "127.0.0.1";
  }

  private getUserAgent(): string {
    return typeof window !== "undefined"
      ? window.navigator.userAgent
      : "Unknown";
  }

  public logEvent(
    type: SecurityEvent["type"],
    details: string,
    severity: SecurityEvent["severity"] = "low",
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

    return {
      totalEvents: this.events.length,
      rateLimitHits: this.events.filter((e) => e.type === "rate_limit").length,
      invalidFiles: this.events.filter((e) => e.type === "invalid_file").length,
      blockedIPs: new Set(
        this.events.filter((e) => e.type === "blocked_ip").map((e) => e.ip)
      ).size,
      last24h: this.events.filter((e) => e.timestamp > last24h).length,
      malwareDetected: this.events.filter((e) => e.type === "malware_detected")
        .length,
      largeSizeBlocked: this.events.filter((e) => e.type === "large_file")
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
  type: SecurityEvent["type"],
  details: string,
  severity: SecurityEvent["severity"] = "low",
  additionalData?: {
    filename?: string;
    fileSize?: number;
    fileType?: string;
    ip?: string;
  }
): SecurityEvent {
  return securityLogger.logEvent(type, details, severity, additionalData);
}

// File scanning function (placeholder for actual implementation)
export async function scanFile(file: File): Promise<{ safe: boolean; threat?: string }> {
  // This is a placeholder implementation
  // In a real scenario, this would integrate with actual malware scanning
  const suspiciousExtensions = ['.exe', '.bat', '.com', '.scr', '.pif'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (suspiciousExtensions.includes(fileExtension)) {
    logSecurityEvent('file_scan', `Suspicious file extension detected: ${fileExtension}`, 'high', {
      filename: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    return { safe: false, threat: 'Suspicious file extension' };
  }
  
  return { safe: true };
}

// Detect suspicious activity patterns
export function detectSuspiciousActivity(ip: string): boolean {
  const events = securityLogger.getEvents();
  const recentEvents = events.filter(event => 
    event.ip === ip && 
    Date.now() - event.timestamp < 5 * 60 * 1000 // Last 5 minutes
  );
  
  // Flag as suspicious if more than 10 events from same IP in 5 minutes
  if (recentEvents.length > 10) {
    logSecurityEvent('suspicious_activity', `High activity from IP: ${ip}`, 'medium', { ip });
    return true;
  }
  
  return false;
}
