/**
 * 🔐 Privacy Sanitizer Service - Data Sanitization Implementation
 * 
 * Implements privacy-compliant data sanitization for UploadHaven.
 * Zero-knowledge principles: Removes/hashes all sensitive data before storage.
 * 
 * @domain privacy
 * @pattern Service Implementation (DDD)
 * @privacy zero-knowledge - sanitizes all sensitive data
 */

import crypto from 'crypto';
import {
  IPrivacySanitizer,
  RawSecurityContext,
  SanitizationResult,
  SanitizationRules,
  PrivacyComplianceResult
} from '../../domain/services/IPrivacySanitizer';
import { SecurityEventContext, SecurityEventMetadata } from '../../domain/entities/SecurityEvent.entity';

/**
 * Privacy-first data sanitization service
 */
export class PrivacySanitizer implements IPrivacySanitizer {
  private readonly saltPrefix = 'uploadhaven_privacy_salt_';

  constructor(
    private readonly globalSalt: string = 'default_salt_change_in_production'
  ) { }

  /**
   * Sanitize security event context for privacy compliance
   */
  async sanitizeContext(rawContext: RawSecurityContext): Promise<SecurityEventContext> {
    return {
      source: rawContext.source,
      action: rawContext.action,
      ipHash: rawContext.ipHash,
      userAgentHash: rawContext.userAgentHash,
      sessionHash: rawContext.sessionHash,
      // ❌ Remove any other potentially sensitive fields
    };
  }  /**
   * Sanitize metadata, removing sensitive fields
   */
  async sanitizeMetadata(rawMetadata: Record<string, any>): Promise<SecurityEventMetadata> {
    // Build object literal to satisfy readonly constraints
    const sanitized: SecurityEventMetadata = {
      ...(rawMetadata.fileSize !== undefined && typeof rawMetadata.fileSize === 'number'
        ? { fileSize: rawMetadata.fileSize } : {}),
      ...(rawMetadata.requestDuration !== undefined && typeof rawMetadata.requestDuration === 'number'
        ? { requestDuration: rawMetadata.requestDuration } : {}),
      ...(rawMetadata.errorCode !== undefined && typeof rawMetadata.errorCode === 'string'
        ? { errorCode: rawMetadata.errorCode } : {}),
      ...(rawMetadata.rateLimit !== undefined && typeof rawMetadata.rateLimit === 'number'
        ? { rateLimit: rawMetadata.rateLimit } : {}),
    };

    return sanitized;
  }

  /**
   * Hash IP address for privacy (SHA-256 with salt)
   */
  async hashIP(ipAddress: string): Promise<string> {
    return this.hashWithSalt(ipAddress, 'ip');
  }

  /**
   * Hash user agent for privacy (SHA-256 with salt)
   */
  async hashUserAgent(userAgent: string): Promise<string> {
    // Truncate user agent to prevent fingerprinting
    const truncated = userAgent.substring(0, 200);
    return this.hashWithSalt(truncated, 'ua');
  }

  /**
   * Hash session identifier for privacy (SHA-256 with salt)
   */
  async hashSession(sessionId: string): Promise<string> {
    return this.hashWithSalt(sessionId, 'session');
  }

  /**
   * Generic data sanitization with privacy rules
   */
  async sanitizeGeneric<T>(
    data: Record<string, any>,
    rules: SanitizationRules
  ): Promise<SanitizationResult<T>> {
    const sanitized: Record<string, any> = {};
    const removedFields: string[] = [];
    const hashedFields: string[] = [];

    // Process all fields according to rules
    for (const [key, value] of Object.entries(data)) {
      if (rules.removeFields.includes(key)) {
        removedFields.push(key);
        continue;
      }

      if (rules.hashFields.includes(key)) {
        if (typeof value === 'string') {
          sanitized[key] = await this.hashWithSalt(value, key);
          hashedFields.push(key);
        } else {
          removedFields.push(key); // Can't hash non-strings
        }
        continue;
      }

      if (rules.allowedFields.includes(key)) {
        let processedValue = value;

        // Apply length limits
        if (typeof value === 'string' && rules.maxStringLength) {
          processedValue = value.substring(0, rules.maxStringLength);
        }

        // Remove empty values if configured
        if (rules.removeEmpty && (value === '' || value === null || value === undefined)) {
          removedFields.push(key);
          continue;
        }

        sanitized[key] = processedValue;
      } else {
        // Field not in allowed list - remove it
        removedFields.push(key);
      }
    }

    // Determine privacy level
    let privacyLevel: 'public' | 'anonymized' | 'hashed' = 'public';
    if (hashedFields.length > 0) {
      privacyLevel = 'hashed';
    } else if (removedFields.length > 0) {
      privacyLevel = 'anonymized';
    }

    return {
      sanitized: sanitized as T,
      removedFields,
      hashedFields,
      privacyLevel
    };
  }

  /**
   * Validate that data meets privacy compliance requirements
   */
  async validatePrivacyCompliance(data: any): Promise<PrivacyComplianceResult> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for common sensitive data patterns
    const sensitivePatterns = [
      { pattern: /password/i, field: 'password fields' },
      { pattern: /secret/i, field: 'secret fields' },
      { pattern: /key/i, field: 'key fields' },
      { pattern: /token/i, field: 'token fields' },
      { pattern: /email/i, field: 'email fields' },
      { pattern: /phone/i, field: 'phone fields' },
      { pattern: /ssn|social.security/i, field: 'SSN fields' },
      { pattern: /credit.card|cc.number/i, field: 'credit card fields' }
    ];

    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        // Check for sensitive field names
        for (const { pattern, field } of sensitivePatterns) {
          if (pattern.test(key)) {
            violations.push(`Found ${field}: ${key}`);
            recommendations.push(`Remove or hash field: ${key}`);
          }
        }

        // Check for potential PII in string values
        if (typeof value === 'string') {
          // Check for email patterns
          if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(value)) {
            violations.push(`Potential email in field: ${key}`);
            recommendations.push(`Hash or remove email from field: ${key}`);
          }

          // Check for IP address patterns
          if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(value)) {
            violations.push(`Potential IP address in field: ${key}`);
            recommendations.push(`Hash IP address in field: ${key}`);
          }
        }
      }
    }

    // Determine compliance level
    let privacyLevel: 'public' | 'anonymized' | 'hashed' | 'non-compliant' = 'public';
    if (violations.length > 0) {
      privacyLevel = 'non-compliant';
    } else if (typeof data === 'object' && Object.keys(data).length === 0) {
      privacyLevel = 'anonymized';
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations,
      privacyLevel
    };
  }
  /**
   * Hash data with salt and type prefix
   * 
   * @private
   */
  private async hashWithSalt(data: string, type: string): Promise<string> {
    const saltedData = `${this.saltPrefix}${type}_${this.globalSalt}_${data}`;

    // Use Node.js crypto for hashing (compatible with tests)
    const hash = crypto.createHash('sha256');
    hash.update(saltedData);
    return hash.digest('hex');
  }
}
