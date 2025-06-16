/**
 * Encryption Configuration Management
 *
 * Manages encryption settings, environment variables, and feature flags
 * for the file encryption system.
 */

/**
 * Encryption configuration interface
 */
export interface EncryptionConfig {
  enabled: boolean;
  enforceEncryption: boolean;
  defaultPassword?: string;
  allowUserPasswords: boolean;
  previewEncryption: boolean;
  maxFileSize: number; // Maximum file size for encryption in bytes
  excludedMimeTypes: string[]; // MIME types to exclude from encryption
}

/**
 * Default encryption configuration
 */
const DEFAULT_CONFIG: EncryptionConfig = {
  enabled: false, // Start disabled for gradual rollout
  enforceEncryption: false, // Don't force encryption initially
  allowUserPasswords: true, // Allow users to provide their own passwords
  previewEncryption: false, // Disable preview encryption initially (Phase 2)
  maxFileSize: 100 * 1024 * 1024, // 100MB max for encryption
  excludedMimeTypes: [
    // Exclude already encrypted formats
    'application/pgp-encrypted',
    'application/x-pkcs7-signature',
  ],
};

/**
 * Parse boolean from environment variable
 */
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Parse file size from environment variable (supports units like 10MB, 5GB)
 */
function parseFileSize(
  value: string | undefined,
  defaultValue: number
): number {
  if (!value) return defaultValue;

  const match = value.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
  if (!match) return defaultValue;

  const size = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  switch (unit) {
    case 'B':
      return size;
    case 'KB':
      return size * 1024;
    case 'MB':
      return size * 1024 * 1024;
    case 'GB':
      return size * 1024 * 1024 * 1024;
    default:
      return defaultValue;
  }
}

/**
 * Parse array from environment variable (comma-separated)
 */
function parseArray(
  value: string | undefined,
  defaultValue: string[]
): string[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Load encryption configuration from environment variables
 */
function loadConfigFromEnv(): EncryptionConfig {
  return {
    enabled: parseBoolean(
      process.env.FILE_ENCRYPTION_ENABLED,
      DEFAULT_CONFIG.enabled
    ),
    enforceEncryption: parseBoolean(
      process.env.FILE_ENCRYPTION_ENFORCE,
      DEFAULT_CONFIG.enforceEncryption
    ),
    defaultPassword:
      process.env.FILE_ENCRYPTION_DEFAULT_PASSWORD ||
      DEFAULT_CONFIG.defaultPassword,
    allowUserPasswords: parseBoolean(
      process.env.FILE_ENCRYPTION_ALLOW_USER_PASSWORDS,
      DEFAULT_CONFIG.allowUserPasswords
    ),
    previewEncryption: parseBoolean(
      process.env.FILE_ENCRYPTION_PREVIEW,
      DEFAULT_CONFIG.previewEncryption
    ),
    maxFileSize: parseFileSize(
      process.env.FILE_ENCRYPTION_MAX_SIZE,
      DEFAULT_CONFIG.maxFileSize
    ),
    excludedMimeTypes: parseArray(
      process.env.FILE_ENCRYPTION_EXCLUDED_TYPES,
      DEFAULT_CONFIG.excludedMimeTypes
    ),
  };
}

/**
 * Current encryption configuration
 */
let config: EncryptionConfig | null = null;

/**
 * Get the current encryption configuration
 */
export function getEncryptionConfig(): EncryptionConfig {
  if (!config) {
    config = loadConfigFromEnv();
  }
  return config;
}

/**
 * Reload configuration from environment variables
 */
export function reloadEncryptionConfig(): EncryptionConfig {
  config = loadConfigFromEnv();
  return config;
}

/**
 * Check if file encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  return getEncryptionConfig().enabled;
}

/**
 * Check if encryption is enforced for all files
 */
export function isEncryptionEnforced(): boolean {
  return getEncryptionConfig().enforceEncryption;
}

/**
 * Check if preview encryption is enabled
 */
export function isPreviewEncryptionEnabled(): boolean {
  return getEncryptionConfig().previewEncryption;
}

/**
 * Check if a file should be encrypted based on configuration
 */
export function shouldEncryptFile(
  fileSize: number,
  mimeType: string,
  userRequested?: boolean
): boolean {
  const config = getEncryptionConfig();

  // If encryption is disabled, don't encrypt unless specifically requested by user
  if (!config.enabled && !userRequested) {
    return false;
  }

  // If encryption is enforced, encrypt everything (subject to other constraints)
  if (config.enforceEncryption) {
    userRequested = true;
  }

  // Check file size limit
  if (fileSize > config.maxFileSize) {
    return false;
  }

  // Check excluded MIME types
  if (config.excludedMimeTypes.includes(mimeType)) {
    return false;
  }

  // Encrypt if user requested or if enforcement is enabled
  return userRequested || config.enforceEncryption;
}

/**
 * Get the default encryption password (if configured)
 */
export function getDefaultEncryptionPassword(): string | undefined {
  return getEncryptionConfig().defaultPassword;
}

/**
 * Check if user-provided passwords are allowed
 */
export function areUserPasswordsAllowed(): boolean {
  return getEncryptionConfig().allowUserPasswords;
}

/**
 * Validate encryption configuration
 */
export function validateEncryptionConfig(config: EncryptionConfig): string[] {
  const errors: string[] = [];

  if (config.maxFileSize <= 0) {
    errors.push('maxFileSize must be greater than 0');
  }

  if (config.enforceEncryption && !config.enabled) {
    errors.push('Cannot enforce encryption when encryption is disabled');
  }

  if (
    config.enforceEncryption &&
    !config.defaultPassword &&
    !config.allowUserPasswords
  ) {
    errors.push(
      'When enforcing encryption, either defaultPassword must be set or userPasswords must be allowed'
    );
  }

  if (config.previewEncryption && !config.enabled) {
    errors.push(
      'Cannot enable preview encryption when file encryption is disabled'
    );
  }

  return errors;
}

/**
 * Get encryption configuration summary for logging/debugging
 */
export function getEncryptionConfigSummary(): string {
  const config = getEncryptionConfig();
  const errors = validateEncryptionConfig(config);

  return JSON.stringify(
    {
      ...config,
      defaultPassword: config.defaultPassword ? '[SET]' : '[NOT SET]',
      maxFileSizeMB:
        Math.round((config.maxFileSize / (1024 * 1024)) * 100) / 100,
      isValid: errors.length === 0,
      validationErrors: errors,
    },
    null,
    2
  );
}

/**
 * Environment variable documentation
 */
export const ENCRYPTION_ENV_DOCS = {
  FILE_ENCRYPTION_ENABLED: 'Enable/disable file encryption (true/false)',
  FILE_ENCRYPTION_ENFORCE: 'Force encryption for all files (true/false)',
  FILE_ENCRYPTION_DEFAULT_PASSWORD:
    'Default password for system-encrypted files',
  FILE_ENCRYPTION_ALLOW_USER_PASSWORDS:
    'Allow users to provide their own passwords (true/false)',
  FILE_ENCRYPTION_PREVIEW: 'Enable preview encryption (true/false)',
  FILE_ENCRYPTION_MAX_SIZE:
    'Maximum file size for encryption (e.g., 100MB, 1GB)',
  FILE_ENCRYPTION_EXCLUDED_TYPES:
    'Comma-separated list of MIME types to exclude',
} as const;

/**
 * Secured Encryption Configuration
 *
 * Optimized configuration for secured/centralized security scenario.
 * This configuration enforces encryption with a single system password.
 */

/**
 * Get secured encryption configuration
 */
export function getSecuredEncryptionConfig(): EncryptionConfig {
  return {
    enabled: true,
    enforceEncryption: true,
    defaultPassword: process.env.FILE_ENCRYPTION_DEFAULT_PASSWORD,
    allowUserPasswords: false, // Secured: centralized control only
    previewEncryption: false, // Phase 2 feature
    maxFileSize: parseFileSize(
      process.env.FILE_ENCRYPTION_MAX_SIZE,
      100 * 1024 * 1024
    ),
    excludedMimeTypes: parseArray(process.env.FILE_ENCRYPTION_EXCLUDED_TYPES, [
      'application/pgp-encrypted',
      'application/x-pkcs7-signature',
    ]),
  };
}

/**
 * Validate secured encryption setup
 */
export function validateSecuredSetup(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.FILE_ENCRYPTION_DEFAULT_PASSWORD) {
    errors.push(
      'FILE_ENCRYPTION_DEFAULT_PASSWORD must be set for secured mode'
    );
  } else if (process.env.FILE_ENCRYPTION_DEFAULT_PASSWORD.length < 32) {
    errors.push(
      'Default password should be at least 32 characters for secured encryption'
    );
  }

  if (process.env.FILE_ENCRYPTION_ALLOW_USER_PASSWORDS === 'true') {
    errors.push(
      'Secured mode should have FILE_ENCRYPTION_ALLOW_USER_PASSWORDS=false'
    );
  }

  if (process.env.FILE_ENCRYPTION_ENFORCE !== 'true') {
    errors.push('Secured mode should have FILE_ENCRYPTION_ENFORCE=true');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Log secured encryption configuration on startup
 */
export function logSecuredSetup(): void {
  const validation = validateSecuredSetup();
  const config = getEncryptionConfig();

  console.log('🔒 SECURED ENCRYPTION MODE');
  console.log('================================');
  console.log(`✓ Encryption enabled: ${config.enabled}`);
  console.log(`✓ Enforce encryption: ${config.enforceEncryption}`);
  console.log(
    `✓ User passwords: ${config.allowUserPasswords ? 'ALLOWED' : 'DISABLED'}`
  );
  console.log(
    `✓ Default password: ${config.defaultPassword ? 'SET' : 'NOT SET'}`
  );
  console.log(
    `✓ Max file size: ${Math.round(config.maxFileSize / (1024 * 1024))}MB`
  );
  console.log(`✓ Excluded types: ${config.excludedMimeTypes.length} types`);

  if (!validation.isValid) {
    console.error('🚨 SECURED SETUP ERRORS:');
    validation.errors.forEach((error: string) =>
      console.error(`   - ${error}`)
    );
    throw new Error('Invalid secured encryption configuration');
  }

  console.log('✅ Secured encryption configuration is valid');
}
