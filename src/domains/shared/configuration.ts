/**
 * Configuration centralisée pour les règles métier
 */
export interface AppConfiguration {
  file: FileConfiguration;
  share: ShareConfiguration;
  security: SecurityConfiguration;
  storage: StorageConfiguration;
  features: FeatureFlags;
}

export interface FileConfiguration {
  maxFileSize: number; // en bytes
  allowedMimeTypes: string[];
  defaultExpirationHours: number;
  maxExpirationHours: number;
  minExpirationHours: number;
  defaultMaxDownloads?: number;
  maxMaxDownloads: number;
}

export interface ShareConfiguration {
  defaultExpirationHours: number;
  maxExpirationHours: number;
  minExpirationHours: number;
  defaultMaxAccess?: number;
  maxMaxAccess: number;
  allowPasswordProtection: boolean;
}

export interface SecurityConfiguration {
  requirePasswordForLargeFiles: boolean;
  largeFileSizeThreshold: number; // en bytes
  rateLimiting: {
    uploadsPerHour: number;
    downloadsPerHour: number;
    shareCreationPerHour: number;
  };
  encryptionSettings: {
    keyDerivationIterations: number;
    saltLength: number;
    ivLength: number;
  };
}

export interface StorageConfiguration {
  cleanupIntervalHours: number;
  tempFileRetentionHours: number;
  storageProvider: 'disk' | 's3' | 'gcs';
  compressionEnabled: boolean;
}

export interface FeatureFlags {
  fileSharing: boolean;
  passwordProtection: boolean;
  downloadLimits: boolean;
  adminDashboard: boolean;
  apiAccess: boolean;
  bulkOperations: boolean;
  filePreview: boolean;
  analyticsTracking: boolean;
}

/**
 * Configuration par défaut
 */
export const DEFAULT_CONFIGURATION: AppConfiguration = {
  file: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ],
    defaultExpirationHours: 24,
    maxExpirationHours: 168, // 7 jours
    minExpirationHours: 1,
    maxMaxDownloads: 100
  },
  share: {
    defaultExpirationHours: 24,
    maxExpirationHours: 168,
    minExpirationHours: 1,
    maxMaxAccess: 1000,
    allowPasswordProtection: true
  },
  security: {
    requirePasswordForLargeFiles: true,
    largeFileSizeThreshold: 50 * 1024 * 1024, // 50MB
    rateLimiting: {
      uploadsPerHour: 50,
      downloadsPerHour: 200,
      shareCreationPerHour: 100
    },
    encryptionSettings: {
      keyDerivationIterations: 100000,
      saltLength: 32,
      ivLength: 16
    }
  },
  storage: {
    cleanupIntervalHours: 6,
    tempFileRetentionHours: 1,
    storageProvider: 'disk',
    compressionEnabled: false
  },
  features: {
    fileSharing: true,
    passwordProtection: true,
    downloadLimits: true,
    adminDashboard: true,
    apiAccess: true,
    bulkOperations: false,
    filePreview: false,
    analyticsTracking: true
  }
};

/**
 * Service de configuration avec validation
 */
export class ConfigurationService {
  private config: AppConfiguration;

  constructor(config: Partial<AppConfiguration> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.validateConfiguration();
  }

  getFileConfig(): FileConfiguration {
    return this.config.file;
  }

  getShareConfig(): ShareConfiguration {
    return this.config.share;
  }

  getSecurityConfig(): SecurityConfiguration {
    return this.config.security;
  }

  getStorageConfig(): StorageConfiguration {
    return this.config.storage;
  }

  getFeatureFlags(): FeatureFlags {
    return this.config.features;
  }

  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  updateConfig(updates: Partial<AppConfiguration>): void {
    this.config = this.mergeWithDefaults(updates);
    this.validateConfiguration();
  }

  private mergeWithDefaults(config: Partial<AppConfiguration>): AppConfiguration {
    return {
      file: { ...DEFAULT_CONFIGURATION.file, ...config.file },
      share: { ...DEFAULT_CONFIGURATION.share, ...config.share },
      security: { ...DEFAULT_CONFIGURATION.security, ...config.security },
      storage: { ...DEFAULT_CONFIGURATION.storage, ...config.storage },
      features: { ...DEFAULT_CONFIGURATION.features, ...config.features }
    };
  }

  private validateConfiguration(): void {
    const { file, share, security } = this.config;

    // Validation des limites de fichier
    if (file.maxFileSize <= 0) {
      throw new Error('maxFileSize must be greater than 0');
    }

    if (file.minExpirationHours >= file.maxExpirationHours) {
      throw new Error('minExpirationHours must be less than maxExpirationHours');
    }

    // Validation des limites de partage
    if (share.minExpirationHours >= share.maxExpirationHours) {
      throw new Error('share minExpirationHours must be less than maxExpirationHours');
    }

    // Validation de la sécurité
    if (security.largeFileSizeThreshold > file.maxFileSize) {
      throw new Error('largeFileSizeThreshold cannot be greater than maxFileSize');
    }

    if (security.encryptionSettings.saltLength < 16) {
      throw new Error('saltLength must be at least 16 bytes');
    }

    if (security.encryptionSettings.ivLength < 12) {
      throw new Error('ivLength must be at least 12 bytes');
    }
  }
}
