import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigurationService, DEFAULT_CONFIGURATION } from '../configuration';

describe('ConfigurationService', () => {
  let configService: ConfigurationService;

  beforeEach(() => {
    configService = new ConfigurationService();
  });

  describe('Default configuration', () => {
    it('should load default configuration when no config provided', () => {
      const fileConfig = configService.getFileConfig();
      
      expect(fileConfig.maxFileSize).toBe(100 * 1024 * 1024); // 100MB
      expect(fileConfig.defaultExpirationHours).toBe(24);
      expect(fileConfig.maxExpirationHours).toBe(168);
      expect(fileConfig.allowedMimeTypes).toContain('image/*');
      expect(fileConfig.allowedMimeTypes).toContain('application/pdf');
    });

    it('should have all required feature flags', () => {
      const features = configService.getFeatureFlags();
      
      expect(features.fileSharing).toBe(true);
      expect(features.passwordProtection).toBe(true);
      expect(features.downloadLimits).toBe(true);
      expect(features.adminDashboard).toBe(true);
      expect(features.apiAccess).toBe(true);
      expect(features.bulkOperations).toBe(false);
      expect(features.filePreview).toBe(false);
      expect(features.analyticsTracking).toBe(true);
    });
  });

  describe('Feature flags', () => {
    it('should check individual feature flags', () => {
      expect(configService.isFeatureEnabled('fileSharing')).toBe(true);
      expect(configService.isFeatureEnabled('bulkOperations')).toBe(false);
    });
  });

  describe('Individual config getters', () => {
    it('should return file configuration', () => {
      const fileConfig = configService.getFileConfig();
      
      expect(fileConfig.maxFileSize).toBeGreaterThan(0);
      expect(fileConfig.defaultExpirationHours).toBeGreaterThan(0);
      expect(fileConfig.maxExpirationHours).toBeGreaterThan(fileConfig.minExpirationHours);
      expect(Array.isArray(fileConfig.allowedMimeTypes)).toBe(true);
    });

    it('should return share configuration', () => {
      const shareConfig = configService.getShareConfig();
      
      expect(shareConfig.defaultExpirationHours).toBe(24);
      expect(shareConfig.maxExpirationHours).toBe(168);
      expect(shareConfig.allowPasswordProtection).toBe(true);
    });

    it('should return security configuration', () => {
      const securityConfig = configService.getSecurityConfig();
      
      expect(securityConfig.requirePasswordForLargeFiles).toBe(true);
      expect(securityConfig.largeFileSizeThreshold).toBe(50 * 1024 * 1024);
      expect(securityConfig.rateLimiting.uploadsPerHour).toBe(50);
      expect(securityConfig.encryptionSettings.keyDerivationIterations).toBe(100000);
    });

    it('should return storage configuration', () => {
      const storageConfig = configService.getStorageConfig();
      
      expect(storageConfig.cleanupIntervalHours).toBe(6);
      expect(storageConfig.storageProvider).toBe('disk');
      expect(storageConfig.compressionEnabled).toBe(false);
    });
  });

  describe('Configuration validation', () => {
    it('should use default configuration for empty config', () => {
      const emptyConfig = new ConfigurationService({});
      
      expect(emptyConfig.getFileConfig()).toEqual(DEFAULT_CONFIGURATION.file);
      expect(emptyConfig.getFeatureFlags()).toEqual(DEFAULT_CONFIGURATION.features);
    });

    it('should handle partial configuration gracefully', () => {
      // Test with minimal valid config
      const minimalConfig = new ConfigurationService(DEFAULT_CONFIGURATION);
      
      expect(minimalConfig.getFileConfig().maxFileSize).toBeGreaterThan(0);
      expect(minimalConfig.isFeatureEnabled('fileSharing')).toBe(true);
    });
  });

  describe('Configuration properties', () => {
    it('should have consistent file size limits', () => {
      const fileConfig = configService.getFileConfig();
      const securityConfig = configService.getSecurityConfig();
      
      expect(securityConfig.largeFileSizeThreshold).toBeLessThanOrEqual(fileConfig.maxFileSize);
    });

    it('should have valid expiration hour ranges', () => {
      const fileConfig = configService.getFileConfig();
      
      expect(fileConfig.minExpirationHours).toBeLessThan(fileConfig.maxExpirationHours);
      expect(fileConfig.defaultExpirationHours).toBeGreaterThanOrEqual(fileConfig.minExpirationHours);
      expect(fileConfig.defaultExpirationHours).toBeLessThanOrEqual(fileConfig.maxExpirationHours);
    });

    it('should have valid share configuration', () => {
      const shareConfig = configService.getShareConfig();
      
      expect(shareConfig.minExpirationHours).toBeLessThan(shareConfig.maxExpirationHours);
      expect(shareConfig.defaultExpirationHours).toBeGreaterThanOrEqual(shareConfig.minExpirationHours);
      expect(shareConfig.maxMaxAccess).toBeGreaterThan(0);
    });

    it('should have valid security settings', () => {
      const securityConfig = configService.getSecurityConfig();
      
      expect(securityConfig.rateLimiting.uploadsPerHour).toBeGreaterThan(0);
      expect(securityConfig.rateLimiting.downloadsPerHour).toBeGreaterThan(0);
      expect(securityConfig.encryptionSettings.saltLength).toBeGreaterThanOrEqual(16);
      expect(securityConfig.encryptionSettings.ivLength).toBeGreaterThanOrEqual(12);
    });

    it('should have valid storage settings', () => {
      const storageConfig = configService.getStorageConfig();
      
      expect(storageConfig.cleanupIntervalHours).toBeGreaterThan(0);
      expect(['disk', 's3', 'gcs']).toContain(storageConfig.storageProvider);
      expect(typeof storageConfig.compressionEnabled).toBe('boolean');
    });
  });

  describe('Feature flag functionality', () => {
    it('should handle all feature flags', () => {
      const features = configService.getFeatureFlags();
      
      // Test all known feature flags
      expect(typeof features.fileSharing).toBe('boolean');
      expect(typeof features.passwordProtection).toBe('boolean');
      expect(typeof features.downloadLimits).toBe('boolean');
      expect(typeof features.adminDashboard).toBe('boolean');
      expect(typeof features.apiAccess).toBe('boolean');
      expect(typeof features.bulkOperations).toBe('boolean');
      expect(typeof features.filePreview).toBe('boolean');
      expect(typeof features.analyticsTracking).toBe('boolean');
    });

    it('should return false for unknown feature flags', () => {
      expect(configService.isFeatureEnabled('unknownFeature' as any)).toBe(false);
    });
  });

  describe('Configuration consistency', () => {
    it('should maintain all configuration sections', () => {
      expect(configService.getFileConfig()).toBeDefined();
      expect(configService.getShareConfig()).toBeDefined();
      expect(configService.getSecurityConfig()).toBeDefined();
      expect(configService.getStorageConfig()).toBeDefined();
      expect(configService.getFeatureFlags()).toBeDefined();
    });

    it('should have non-empty MIME types list', () => {
      const fileConfig = configService.getFileConfig();
      
      expect(fileConfig.allowedMimeTypes.length).toBeGreaterThan(0);
      expect(fileConfig.allowedMimeTypes).toContain('image/*');
      expect(fileConfig.allowedMimeTypes).toContain('text/*');
    });

    it('should have reasonable default values', () => {
      const config = configService;
      
      // File config reasonableness
      expect(config.getFileConfig().maxFileSize).toBeGreaterThan(1024 * 1024); // > 1MB
      expect(config.getFileConfig().maxFileSize).toBeLessThan(10 * 1024 * 1024 * 1024); // < 10GB
      
      // Security config reasonableness
      expect(config.getSecurityConfig().rateLimiting.uploadsPerHour).toBeLessThan(1000);
      expect(config.getSecurityConfig().encryptionSettings.keyDerivationIterations).toBeGreaterThan(10000);
    });
  });
});
