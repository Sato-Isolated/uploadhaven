/**
 * Privacy Sanitizer Service Interface - Data Sanitization for Privacy Compliance
 * 
 * Defines the contract for sanitizing sensitive data before storage
 * to ensure zero-knowledge and privacy compliance.
 * 
 * @domain privacy
 * @pattern Domain Service Interface (DDD)
 * @privacy zero-knowledge - sanitizes all sensitive data
 */

import { SecurityEventContext, SecurityEventMetadata } from '../entities/SecurityEvent.entity';

/**
 * Raw context data that may contain sensitive information
 */
export interface RawSecurityContext {
  readonly source: 'api' | 'upload' | 'download' | 'auth' | 'system';
  readonly action: string;
  readonly ipHash?: string;
  readonly userAgentHash?: string;
  readonly sessionHash?: string;
  readonly [key: string]: any; // Additional raw data that needs sanitization
}

/**
 * Privacy sanitization results
 */
export interface SanitizationResult<T> {
  readonly sanitized: T;
  readonly removedFields: string[];
  readonly hashedFields: string[];
  readonly privacyLevel: 'public' | 'anonymized' | 'hashed';
}

/**
 * Service interface for privacy-compliant data sanitization
 */
export interface IPrivacySanitizer {
  /**
   * Sanitize security event context for privacy compliance
   */
  sanitizeContext(rawContext: RawSecurityContext): Promise<SecurityEventContext>;

  /**
   * Sanitize metadata, removing sensitive fields
   */
  sanitizeMetadata(rawMetadata: Record<string, any>): Promise<SecurityEventMetadata>;

  /**
   * Hash IP address for privacy (SHA-256 with salt)
   */
  hashIP(ipAddress: string): Promise<string>;

  /**
   * Hash user agent for privacy (SHA-256 with salt)
   */
  hashUserAgent(userAgent: string): Promise<string>;

  /**
   * Hash session identifier for privacy (SHA-256 with salt)
   */
  hashSession(sessionId: string): Promise<string>;

  /**
   * Generic data sanitization with privacy rules
   */
  sanitizeGeneric<T>(data: Record<string, any>, rules: SanitizationRules): Promise<SanitizationResult<T>>;

  /**
   * Validate that data meets privacy compliance requirements
   */
  validatePrivacyCompliance(data: any): Promise<PrivacyComplianceResult>;
}

/**
 * Rules for data sanitization
 */
export interface SanitizationRules {
  readonly allowedFields: string[];
  readonly hashFields: string[];
  readonly removeFields: string[];
  readonly maxStringLength?: number;
  readonly removeEmpty?: boolean;
}

/**
 * Privacy compliance validation result
 */
export interface PrivacyComplianceResult {
  readonly isCompliant: boolean;
  readonly violations: string[];
  readonly recommendations: string[];
  readonly privacyLevel: 'public' | 'anonymized' | 'hashed' | 'non-compliant';
}
