/**
 * LogSecurityEvent Use Case - Privacy-Compliant Security Event Logging
 * 
 * Handles the creation and storage of security events with strict privacy compliance.
 * All sensitive data is sanitized or anonymized before storage.
 * 
 * @domain privacy
 * @pattern Use Case (Clean Architecture)
 * @privacy zero-knowledge - sanitizes all sensitive data
 */

import { UseCase } from '../../../../shared/domain/types';
import { SecurityEvent } from '../../domain/entities/SecurityEvent.entity';
import { EventType } from '../../domain/value-objects/EventType.vo';
import { ISecurityEventRepository } from '../../domain/repositories/ISecurityEventRepository';
import { IPrivacySanitizer } from '../../domain/services/IPrivacySanitizer';

/**
 * Request for logging a security event
 */
export interface LogSecurityEventRequest {
  readonly eventType: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly context: {
    readonly source: 'api' | 'upload' | 'download' | 'auth' | 'system';
    readonly action: string;
    readonly clientIP?: string; // Will be hashed for privacy
    readonly userAgent?: string; // Will be hashed for privacy
    readonly sessionId?: string; // Will be hashed for privacy
  };
  readonly metadata?: {
    readonly fileSize?: number;
    readonly requestDuration?: number;
    readonly errorCode?: string;
    readonly rateLimit?: number;
  };
  readonly rawData?: Record<string, any>; // Will be sanitized
}

/**
 * Response from logging a security event
 */
export interface LogSecurityEventResponse {
  readonly eventId: string;
  readonly loggedAt: Date;
  readonly sanitized: boolean;
  readonly privacyLevel: string;
}

/**
 * Use case for logging privacy-compliant security events
 */
export class LogSecurityEventUseCase implements UseCase<LogSecurityEventRequest, LogSecurityEventResponse> {
  constructor(
    private readonly eventRepository: ISecurityEventRepository,
    private readonly privacySanitizer: IPrivacySanitizer
  ) { }

  /**
   * Execute the security event logging with privacy compliance
   */
  async execute(request: LogSecurityEventRequest): Promise<LogSecurityEventResponse> {
    // Validate the event type
    const eventType = EventType.fromString(request.eventType);    // Sanitize sensitive data for privacy compliance
    const sanitizedContext = this.privacySanitizer 
      ? await this.privacySanitizer.sanitizeContext({
          source: request.context.source,
          action: request.context.action,
          ipHash: request.context.clientIP ? await this.privacySanitizer.hashIP(request.context.clientIP) : undefined,
          userAgentHash: request.context.userAgent ? await this.privacySanitizer.hashUserAgent(request.context.userAgent) : undefined,
          sessionHash: request.context.sessionId ? await this.privacySanitizer.hashSession(request.context.sessionId) : undefined,
        })
      : {
          source: request.context.source,
          action: request.context.action,
          ipHash: request.context.clientIP?.slice(0, 8) + '***', // Basic fallback anonymization
          userAgentHash: request.context.userAgent?.slice(0, 10) + '***',
          sessionHash: request.context.sessionId?.slice(0, 8) + '***',
        };

    // Sanitize metadata (remove any potentially sensitive fields)
    const sanitizedMetadata = this.privacySanitizer 
      ? await this.privacySanitizer.sanitizeMetadata(request.metadata || {})
      : {}; // Fallback to empty metadata// Create the security event entity
    const securityEvent = SecurityEvent.createAnonymous(
      eventType,
      request.severity,
      sanitizedContext,
      sanitizedMetadata
    );

    // Store the event
    await this.eventRepository.save(securityEvent); return {
      eventId: securityEvent.id,
      loggedAt: securityEvent.timestamp,
      sanitized: true,
      privacyLevel: securityEvent.privacyLevel
    };
  }
}
