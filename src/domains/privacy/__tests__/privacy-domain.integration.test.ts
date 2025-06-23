/**
 * 🔐 Privacy Domain Integration Test
 * 
 * Tests the core Privacy domain functionality including
 * audit logging, privacy sanitization, and security monitoring.
 * 
 * @domain privacy
 * @pattern Integration Test (DDD)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityEvent } from '../domain/entities/SecurityEvent.entity';
import { EventType } from '../domain/value-objects/EventType.vo';
import { PrivacyLevel } from '../domain/value-objects/PrivacyLevel.vo';
import { AnonymizedIdentifier } from '../domain/value-objects/AnonymizedIdentifier.vo';
import { PrivacySanitizer } from '../infrastructure/sanitization/privacy-sanitizer.service';

describe('Privacy Domain Integration', () => {
  let privacySanitizer: PrivacySanitizer;

  beforeEach(() => {
    privacySanitizer = new PrivacySanitizer('test_salt');
  });

  describe('SecurityEvent Entity', () => {
    it('should create anonymous security event', () => {
      // Arrange
      const eventType = EventType.fromString('file.upload.success');
      const severity = 'low' as const;
      const context = {
        source: 'upload' as const,
        action: 'anonymous_upload',
        ipHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', // Valid SHA-256
      };

      // Act
      const securityEvent = SecurityEvent.createAnonymous(
        eventType,
        severity,
        context
      );

      // Assert
      expect(securityEvent.id).toBeDefined();
      expect(securityEvent.eventType).toBe('file.upload.success');
      expect(securityEvent.severity).toBe('low');
      expect(securityEvent.context.source).toBe('upload');
      expect(securityEvent.context.action).toBe('anonymous_upload');
      expect(securityEvent.context.ipHash).toBe('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456');
      expect(securityEvent.timestamp).toBeInstanceOf(Date);
    }); it('should not expose sensitive data', () => {
      // Arrange
      const eventType = EventType.fromString('auth.login.failed');
      const context = {
        source: 'auth' as const,
        action: 'login_attempt',
        ipHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a', // Valid SHA-256
      };

      // Act
      const securityEvent = SecurityEvent.createAnonymous(
        eventType,
        'medium',
        context
      );

      // Assert
      expect(securityEvent.context.ipHash).toBe('b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a'); // Only hashed data
      expect(securityEvent.context).not.toHaveProperty('userAgent'); // No raw user agent
      expect(securityEvent.context).not.toHaveProperty('sessionId'); // No raw session
    });
  });

  describe('Privacy Sanitizer', () => {
    it('should sanitize security context', async () => {
      // Arrange
      const rawContext = {
        source: 'api' as const,
        action: 'file_download',
        ipHash: 'already_hashed_ip',
        userAgentHash: 'already_hashed_ua',
      };

      // Act
      const sanitized = await privacySanitizer.sanitizeContext(rawContext);

      // Assert
      expect(sanitized.source).toBe('api');
      expect(sanitized.action).toBe('file_download');
      expect(sanitized.ipHash).toBe('already_hashed_ip');
      expect(sanitized.userAgentHash).toBe('already_hashed_ua');
    });

    it('should sanitize metadata by removing sensitive fields', async () => {
      // Arrange
      const rawMetadata = {
        fileSize: 1024,
        requestDuration: 250,
        errorCode: 'INVALID_FILE',
        rateLimit: 100,
        // Sensitive fields that should be removed
        userId: 'user123',
        password: 'secret',
        filename: 'secret_document.pdf',
      };

      // Act
      const sanitized = await privacySanitizer.sanitizeMetadata(rawMetadata);

      // Assert
      expect(sanitized.fileSize).toBe(1024);
      expect(sanitized.requestDuration).toBe(250);
      expect(sanitized.errorCode).toBe('INVALID_FILE');
      expect(sanitized.rateLimit).toBe(100);

      // Sensitive fields should not be present
      expect(sanitized).not.toHaveProperty('userId');
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('filename');
    });

    it('should hash IP addresses for privacy', async () => {
      // Arrange
      const ipAddress = '192.168.1.100';

      // Act
      const hashedIP = await privacySanitizer.hashIP(ipAddress);

      // Assert
      expect(hashedIP).toBeDefined();
      expect(hashedIP).toHaveLength(64); // SHA-256 hash length
      expect(hashedIP).not.toBe(ipAddress); // Should be hashed, not original
      expect(hashedIP).toMatch(/^[a-f0-9]{64}$/); // Valid hex string
    });

    it('should validate privacy compliance', async () => {
      // Arrange
      const compliantData = {
        fileSize: 1024,
        requestDuration: 250,
        errorCode: 'SUCCESS',
      };

      const nonCompliantData = {
        fileSize: 1024,
        email: 'user@example.com',
        password: 'secret123',
      };

      // Act
      const compliantResult = await privacySanitizer.validatePrivacyCompliance(compliantData);
      const nonCompliantResult = await privacySanitizer.validatePrivacyCompliance(nonCompliantData);

      // Assert
      expect(compliantResult.isCompliant).toBe(true);
      expect(compliantResult.violations).toHaveLength(0);

      expect(nonCompliantResult.isCompliant).toBe(false);
      expect(nonCompliantResult.violations.length).toBeGreaterThan(0);
      expect(nonCompliantResult.violations.some(v => v.includes('email'))).toBe(true);
      expect(nonCompliantResult.violations.some(v => v.includes('password'))).toBe(true);
    });
  });

  describe('Value Objects', () => {
    it('should create EventType value object', () => {
      // Act
      const eventType = EventType.fromString('file.upload.success');

      // Assert
      expect(eventType.value).toBe('file.upload.success');
      expect(eventType.toString()).toBe('file.upload.success');
    });

    it('should create PrivacyLevel value object', () => {
      // Act
      const privacyLevel = PrivacyLevel.anonymized();

      // Assert
      expect(privacyLevel.value).toBe('anonymized');
      expect(privacyLevel.toString()).toBe('anonymized');
    });

    it('should generate AnonymizedIdentifier', () => {
      // Act
      const anonymizedId = AnonymizedIdentifier.generate();

      // Assert
      expect(anonymizedId.value).toBeDefined();
      expect(anonymizedId.toString()).toBeDefined();
      expect(anonymizedId.value.length).toBeGreaterThan(0);
    });
  });

  describe('Privacy Guarantees', () => {
    it('should never store raw IP addresses', async () => {
      // Arrange
      const rawIP = '203.0.113.195';

      // Act
      const hashedIP = await privacySanitizer.hashIP(rawIP);

      // Assert
      expect(hashedIP).not.toContain('203');
      expect(hashedIP).not.toContain('113');
      expect(hashedIP).not.toContain('195');
      expect(hashedIP).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should never store sensitive metadata', async () => {
      // Arrange
      const sensitiveData = {
        username: 'admin',
        password: 'secret123',
        apiKey: 'sk-1234567890',
        creditCard: '4111-1111-1111-1111',
        fileSize: 1024, // This should be kept
      };

      // Act
      const sanitized = await privacySanitizer.sanitizeMetadata(sensitiveData);

      // Assert
      expect(sanitized.fileSize).toBe(1024); // Safe data preserved
      expect(sanitized).not.toHaveProperty('username');
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('apiKey');
      expect(sanitized).not.toHaveProperty('creditCard');
    }); it('should enforce zero-knowledge at entity level', () => {
      // Arrange
      const eventType = EventType.fromString('file.download.success');
      const context = {
        source: 'download' as const,
        action: 'file_retrieved',
        ipHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2', // Valid SHA-256
      };

      // Act
      const event = SecurityEvent.createAnonymous(eventType, 'low', context);

      // Assert - Verify no sensitive data can be stored
      expect(event.context).not.toHaveProperty('rawIP');
      expect(event.context).not.toHaveProperty('userAgent');
      expect(event.context).not.toHaveProperty('sessionToken');
      expect(event.context.ipHash).toBe('c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2');
    });
  });
});
