// Security utilities for logging and monitoring security events
export interface SecurityEvent {
  id: string
  type: 'rate_limit' | 'invalid_file' | 'large_file' | 'blocked_ip' | 'suspicious_activity' | 'file_scan' | 'malware_detected' | 'file_upload' | 'user_registration' | 'file_download' | 'user_login' | 'user_logout'
  timestamp: number
  ip: string
  details: string
  severity: 'low' | 'medium' | 'high'
  userAgent?: string
  filename?: string
  fileSize?: number
  fileType?: string
  userId?: string
}

export interface SecurityStats {
  totalEvents: number
  rateLimitHits: number
  invalidFiles: number
  blockedIPs: number
  last24h: number
  malwareDetected: number
  largeSizeBlocked: number
}

class SecurityLogger {
  private static instance: SecurityLogger
  private events: SecurityEvent[] = []
  private eventListeners: ((event: SecurityEvent) => void)[] = []

  private constructor() {
    this.loadEvents()
  }

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }

  private loadEvents() {
    if (typeof window !== 'undefined') {
      try {
        const savedEvents = localStorage.getItem('securityEvents')
        this.events = savedEvents ? JSON.parse(savedEvents) : []
      } catch (error) {
        console.error('Failed to load security events:', error)
        this.events = []
      }
    }
  }

  private saveEvents() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('securityEvents', JSON.stringify(this.events))
      } catch (error) {
        console.error('Failed to save security events:', error)
      }
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getUserIP(): string {
    // In a real implementation, this would get the actual IP
    // For demo purposes, we'll use a simulated IP
    return '127.0.0.1'
  }

  private getUserAgent(): string {
    return typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
  }

  public logEvent(
    type: SecurityEvent['type'],
    details: string,
    severity: SecurityEvent['severity'] = 'low',
    additionalData?: {
      filename?: string
      fileSize?: number
      fileType?: string
      ip?: string
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
      fileType: additionalData?.fileType
    }

    this.events.unshift(event) // Add to beginning for chronological order

    // Keep only last 1000 events to prevent localStorage overflow
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000)
    }

    this.saveEvents()

    // Notify listeners
    this.eventListeners.forEach(listener => listener(event))

    return event
  }

  public getEvents(): SecurityEvent[] {
    return [...this.events]
  }

  public getStats(): SecurityStats {
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)

    return {
      totalEvents: this.events.length,
      rateLimitHits: this.events.filter(e => e.type === 'rate_limit').length,
      invalidFiles: this.events.filter(e => e.type === 'invalid_file').length,
      blockedIPs: new Set(this.events.filter(e => e.type === 'blocked_ip').map(e => e.ip)).size,
      last24h: this.events.filter(e => e.timestamp > last24h).length,
      malwareDetected: this.events.filter(e => e.type === 'malware_detected').length,
      largeSizeBlocked: this.events.filter(e => e.type === 'large_file').length
    }
  }

  public addEventListener(listener: (event: SecurityEvent) => void) {
    this.eventListeners.push(listener)
  }

  public removeEventListener(listener: (event: SecurityEvent) => void) {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  public clearEvents() {
    this.events = []
    this.saveEvents()
  }

  public exportEvents(): string {
    return JSON.stringify(this.events, null, 2)
  }

  // Security analysis methods
  public detectSuspiciousActivity(): SecurityEvent[] {
    const now = Date.now()
    const last5min = now - (5 * 60 * 1000)
    
    // Find IPs with multiple failed attempts in last 5 minutes
    const recentEvents = this.events.filter(e => e.timestamp > last5min)
    const ipCounts: { [ip: string]: number } = {}
    
    recentEvents.forEach(event => {
      if (event.type === 'invalid_file' || event.type === 'large_file') {
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1
      }
    })

    return Object.entries(ipCounts)
      .filter(([, count]) => count >= 3)
      .map(([ip]) => this.logEvent(
        'suspicious_activity',
        `Multiple failed upload attempts from IP ${ip} in last 5 minutes`,
        'high',
        { ip }
      ))
  }

  // File security scanning simulation
  public async scanFile(file: File): Promise<{ safe: boolean; threat?: string }> {
    // Simulate malware scanning delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    // Simulate threat detection (1% chance for demo)
    const isThreat = Math.random() < 0.01
    
    if (isThreat) {
      this.logEvent(
        'malware_detected',
        `Potential malware detected in file: ${file.name}`,
        'high',
        {
          filename: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      )
      return { safe: false, threat: 'Potential malware signature detected' }
    }

    // Log successful scan
    this.logEvent(
      'file_scan',
      `File scan completed for: ${file.name}`,
      'low',
      {
        filename: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    )

    return { safe: true }
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance()

// Utility functions
export const logSecurityEvent = (
  type: SecurityEvent['type'],
  details: string,
  severity: SecurityEvent['severity'] = 'low',
  additionalData?: {
    filename?: string
    fileSize?: number
    fileType?: string
    ip?: string
  }
) => securityLogger.logEvent(type, details, severity, additionalData)

export const getSecurityStats = () => securityLogger.getStats()
export const getSecurityEvents = () => securityLogger.getEvents()
export const clearSecurityEvents = () => securityLogger.clearEvents()
export const scanFile = (file: File) => securityLogger.scanFile(file)
export const detectSuspiciousActivity = () => securityLogger.detectSuspiciousActivity()
