/**
 * ShareUrl Value Object - Zero-knowledge sharing URL
 * 
 * Represents a sharing URL with encryption key in the fragment.
 * Ensures zero-knowledge principle: server never sees the decryption key.
 * 
 * @domain file-sharing
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - key never sent to server
 */

import { FileId } from './file-id.vo';

/**
 * ShareUrl value object for zero-knowledge file sharing
 * 
 * URL Structure: https://uploadhaven.dev/s/{fileId}#{encryptionKey}
 * 
 * Key principles:
 * - Base URL (with fileId) is public and sent to server
 * - Fragment (with encryption key) stays client-side only
 * - Server never receives or stores the encryption key
 * - URL can be safely shared through any channel
 */
export class ShareUrl {
  private constructor(
    private readonly _baseUrl: string,
    private readonly _fileId: FileId,
    private readonly _encryptionKey: string
  ) {
    this.validateBaseUrl(_baseUrl);
    this.validateEncryptionKey(_encryptionKey);
  }

  /**
   * Create a share URL for anonymous file sharing
   */
  static create(
    baseUrl: string,
    fileId: FileId,
    encryptionKey: string
  ): ShareUrl {
    return new ShareUrl(baseUrl, fileId, encryptionKey);
  }

  /**
   * Create share URL from full URL string
   */
  static fromUrl(fullUrl: string): ShareUrl {
    const urlParts = fullUrl.split('#');
    if (urlParts.length !== 2) {
      throw new Error('Invalid share URL format: missing encryption key fragment');
    }

    const [baseUrl, encryptionKey] = urlParts;

    // Extract fileId from base URL
    const fileIdMatch = baseUrl.match(/\/s\/([A-Za-z0-9\-_]{10})$/);
    if (!fileIdMatch) {
      throw new Error('Invalid share URL format: invalid file ID');
    }

    const fileId = FileId.fromString(fileIdMatch[1]);
    return new ShareUrl(baseUrl, fileId, encryptionKey);
  }

  /**
   * Create a base share URL without encryption key (for server-side use)
   * The encryption key will be added client-side later
   */
  static createBase(baseUrl: string, fileId: string): ShareUrl {
    const fullBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const shareBaseUrl = `${fullBaseUrl}/s/${fileId}`;
    const fileIdVo = FileId.fromString(fileId);
    
    // Use a placeholder key that will be replaced client-side
    const placeholderKey = 'PLACEHOLDER_KEY_TO_BE_REPLACED_CLIENT_SIDE';
    
    return new ShareUrl(shareBaseUrl, fileIdVo, placeholderKey);
  }

  /**
   * Validate base URL format
   */
  private validateBaseUrl(baseUrl: string): void {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error('Base URL must be a non-empty string');
    }

    try {
      const url = new URL(baseUrl);
      if (!url.pathname.match(/\/s\/[A-Za-z0-9\-_]{10}$/)) {
        throw new Error('Base URL must match pattern /s/{fileId}');
      }    } catch {
      throw new Error('Invalid base URL format');
    }
  }

  /**
   * Validate encryption key format
   */
  private validateEncryptionKey(encryptionKey: string): void {
    if (!encryptionKey || typeof encryptionKey !== 'string') {
      throw new Error('Encryption key must be a non-empty string');
    }

    // Should be base64url encoded (URL-safe base64)
    const base64UrlPattern = /^[A-Za-z0-9\-_]+$/;
    if (!base64UrlPattern.test(encryptionKey)) {
      throw new Error('Encryption key must be base64url encoded');
    }

    if (encryptionKey.length < 32) {
      throw new Error('Encryption key is too short');
    }
  }

  // =============================================================================
  // Accessors
  // =============================================================================

  get baseUrl(): string {
    return this._baseUrl;
  }

  get fileId(): string {
    return this._fileId.value;
  }

  get encryptionKey(): string {
    return this._encryptionKey;
  }

  get fullUrl(): string {
    return `${this._baseUrl}#${this._encryptionKey}`;
  }

  // =============================================================================
  // Business Logic
  // =============================================================================

  /**
   * Get the public part of the URL (without encryption key)
   * This is what gets sent to the server in HTTP requests
   */
  getPublicUrl(): string {
    return this._baseUrl;
  }

  /**
   * Get the private part of the URL (encryption key only)
   * This stays client-side and is never sent to server
   */
  getPrivateFragment(): string {
    return this._encryptionKey;
  }

  /**
   * Get domain from the URL
   */
  getDomain(): string {
    try {
      const url = new URL(this._baseUrl);
      return url.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if URL is using HTTPS (security requirement)
   */
  isSecure(): boolean {
    try {
      const url = new URL(this._baseUrl);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get URL suitable for sharing in email (with warning)
   */
  getEmailSafeUrl(): string {
    // Note: Email clients often strip URL fragments, so we need to be careful
    return this.fullUrl;
  }

  /**
   * Get URL suitable for QR code generation
   */
  getQRCodeUrl(): string {
    return this.fullUrl;
  }

  /**
   * Create a shortened version indicator (for UI display)
   */
  getShortenedDisplay(): string {
    const domain = this.getDomain();
    const fileId = this._fileId.value;
    return `${domain}/s/${fileId}#***`;
  }

  // =============================================================================
  // Security Methods
  // =============================================================================

  /**
   * Validate that this URL follows zero-knowledge principles
   */
  validateZeroKnowledge(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!this.isSecure()) {
      issues.push('URL must use HTTPS for security');
    }

    if (this._baseUrl.includes(this._encryptionKey)) {
      issues.push('Encryption key must not appear in base URL');
    }

    if (this._encryptionKey.length < 32) {
      issues.push('Encryption key appears to be too short');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check if URL can be safely shared through insecure channels
   */
  isSafeForInsecureSharing(): boolean {
    const validation = this.validateZeroKnowledge();
    return validation.isValid && this.isSecure();
  }

  // =============================================================================
  // Value Object Methods
  // =============================================================================

  /**
   * Check equality with another ShareUrl
   */
  equals(other: ShareUrl): boolean {
    return this._baseUrl === other._baseUrl &&
      this._encryptionKey === other._encryptionKey;
  }

  /**
   * String representation (safe for logging - no encryption key)
   */
  toString(): string {
    return `ShareUrl{ fileId: '${this._fileId.value}', domain: '${this.getDomain()}', secure: ${this.isSecure()} }`;
  }

  /**
   * JSON serialization (safe - no encryption key in logs)
   */
  toJSON(): {
    fileId: string;
    domain: string;
    secure: boolean;
    // Note: encryptionKey intentionally excluded for security
  } {
    return {
      fileId: this._fileId.value,
      domain: this.getDomain(),
      secure: this.isSecure(),
    };
  }

  /**
   * Get full URL for client-side use only
   * WARNING: Only use this on the client side, never log or store
   */
  toClientUrl(): string {
    return this.fullUrl;
  }
}
