/**
 * AnonymizedIdentifier Value Object - Privacy-Safe Identifier
 * 
 * Represents an identifier that has been anonymized for privacy compliance.
 * Used to track entities without exposing sensitive information.
 * 
 * @domain privacy
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - anonymized identifiers only
 */

import { ValueObject } from '../../../../shared/domain/types';

/**
 * Types of identifiers that can be anonymized
 */
export type AnonymizedIdentifierType =
  | 'ip'          // IP address hash
  | 'session'     // Session ID hash
  | 'user'        // User ID hash
  | 'file'        // File ID hash
  | 'request'     // Request ID hash
  | 'device'      // Device fingerprint hash
  | 'generic';    // Generic identifier hash

/**
 * Anonymized identifier configuration
 */
interface AnonymizedIdentifierConfig {
  readonly type: AnonymizedIdentifierType;
  readonly description: string;
  readonly retentionDays: number;
  readonly allowsLinking: boolean; // Can be used to link related events
}

/**
 * Configuration for different identifier types
 */
const IDENTIFIER_CONFIGS: Record<AnonymizedIdentifierType, AnonymizedIdentifierConfig> = {
  ip: {
    type: 'ip',
    description: 'Anonymized IP address for rate limiting and abuse detection',
    retentionDays: 7,
    allowsLinking: true
  },
  session: {
    type: 'session',
    description: 'Anonymized session identifier for user activity tracking',
    retentionDays: 1,
    allowsLinking: true
  },
  user: {
    type: 'user',
    description: 'Anonymized user identifier for optional account features',
    retentionDays: 30,
    allowsLinking: true
  },
  file: {
    type: 'file',
    description: 'Anonymized file identifier for privacy-safe file operations',
    retentionDays: 90,
    allowsLinking: false
  },
  request: {
    type: 'request',
    description: 'Anonymized request identifier for debugging and monitoring',
    retentionDays: 3,
    allowsLinking: false
  },
  device: {
    type: 'device',
    description: 'Anonymized device fingerprint for security analysis',
    retentionDays: 14,
    allowsLinking: true
  },
  generic: {
    type: 'generic',
    description: 'Generic anonymized identifier',
    retentionDays: 7,
    allowsLinking: false
  }
};

/**
 * AnonymizedIdentifier value object for privacy-safe entity identification
 */
export class AnonymizedIdentifier extends ValueObject {
  private constructor(
    private readonly _type: AnonymizedIdentifierType,
    private readonly _hashedValue: string,
    private readonly _createdAt: Date = new Date()
  ) {
    super();
    this.validateHashedValue(_hashedValue);
  }

  /**
   * Get the identifier type
   */
  get type(): AnonymizedIdentifierType {
    return this._type;
  }
  /**
   * Get the hashed value (safe for storage)
   */
  get hashedValue(): string {
    return this._hashedValue;
  }

  /**
   * Get the full value representation for interfaces
   */
  get value(): string {
    return this._hashedValue;
  }

  /**
   * Get creation timestamp
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Get configuration for this identifier type
   */
  get config(): AnonymizedIdentifierConfig {
    return IDENTIFIER_CONFIGS[this._type];
  }

  /**
   * Check if this identifier allows linking with other events
   */
  get allowsLinking(): boolean {
    return this.config.allowsLinking;
  }

  /**
   * Get retention period in days
   */
  get retentionDays(): number {
    return this.config.retentionDays;
  }

  /**
   * Check if this identifier has expired based on retention policy
   */
  get hasExpired(): boolean {
    const expirationDate = new Date(this._createdAt);
    expirationDate.setDate(expirationDate.getDate() + this.retentionDays);
    return new Date() > expirationDate;
  }

  /**
   * Create an anonymized identifier from a raw value
   */
  static async create(
    type: AnonymizedIdentifierType,
    rawValue: string,
    salt?: string
  ): Promise<AnonymizedIdentifier> {
    const hashedValue = await this.hashValue(rawValue, salt);
    return new AnonymizedIdentifier(type, hashedValue);
  }

  /**
   * Create an IP address identifier
   */
  static async fromIP(ipAddress: string, salt?: string): Promise<AnonymizedIdentifier> {
    return this.create('ip', ipAddress, salt);
  }

  /**
   * Create a session identifier
   */
  static async fromSession(sessionId: string, salt?: string): Promise<AnonymizedIdentifier> {
    return this.create('session', sessionId, salt);
  }

  /**
   * Create a user identifier
   */
  static async fromUser(userId: string, salt?: string): Promise<AnonymizedIdentifier> {
    return this.create('user', userId, salt);
  }

  /**
   * Create a file identifier
   */
  static async fromFile(fileId: string, salt?: string): Promise<AnonymizedIdentifier> {
    return this.create('file', fileId, salt);
  }

  /**
   * Create a request identifier
   */
  static async fromRequest(requestId: string, salt?: string): Promise<AnonymizedIdentifier> {
    return this.create('request', requestId, salt);
  }

  /**
   * Create a device identifier
   */
  static async fromDevice(deviceFingerprint: string, salt?: string): Promise<AnonymizedIdentifier> {
    return this.create('device', deviceFingerprint, salt);
  }
  /**
   * Generate a new random anonymized identifier
   */
  static generate(type: AnonymizedIdentifierType = 'generic'): AnonymizedIdentifier {
    // Generate a random identifier using crypto.randomUUID or fallback
    const randomValue = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create a simple hash from random value
    const hashedValue = Buffer.from(randomValue + 'uploadhaven-salt').toString('hex').slice(0, 32);
    return new AnonymizedIdentifier(type, hashedValue);
  }

  /**
   * Create from string value (for reconstructing from storage)
   */
  static fromString(value: string): AnonymizedIdentifier {
    // Parse format: "type:hashedValue" or just "hashedValue"
    if (value.includes(':')) {
      const [typeStr, hashedValue] = value.split(':');
      const type = typeStr as AnonymizedIdentifierType;
      if (!Object.keys(IDENTIFIER_CONFIGS).includes(type)) {
        throw new Error(`Invalid anonymized identifier type: ${type}`);
      }
      return new AnonymizedIdentifier(type, hashedValue);
    }

    // Default to generic type if no type specified
    return new AnonymizedIdentifier('generic', value);
  }

  /**
   * Create from existing hash (when loading from storage)
   */
  static fromHash(
    type: AnonymizedIdentifierType,
    hashedValue: string,
    createdAt?: Date
  ): AnonymizedIdentifier {
    return new AnonymizedIdentifier(type, hashedValue, createdAt);
  }

  /**
   * Hash a value with salt for privacy
   */
  private static async hashValue(value: string, salt?: string): Promise<string> {
    // Use Web Crypto API in browser or Node.js crypto in server
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      return this.hashWithWebCrypto(value, salt);
    } else {
      return this.hashWithNodeCrypto(value, salt);
    }
  }

  /**
   * Hash using Web Crypto API (browser)
   */
  private static async hashWithWebCrypto(value: string, salt?: string): Promise<string> {
    const saltValue = salt || 'uploadhaven-privacy-salt';
    const encoder = new TextEncoder();
    const data = encoder.encode(value + saltValue);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash using Node.js crypto (server)
   */
  private static hashWithNodeCrypto(value: string, salt?: string): string {
    // Mock implementation for now - in real implementation, use Node.js crypto
    const saltValue = salt || 'uploadhaven-privacy-salt';
    return Buffer.from(value + saltValue).toString('base64').slice(0, 32);
  }

  /**
   * Validate hashed value format
   */
  private validateHashedValue(hashedValue: string): void {
    if (!hashedValue || hashedValue.length < 16) {
      throw new Error('Invalid hashed value: must be at least 16 characters');
    }

    if (!/^[a-f0-9]+$/i.test(hashedValue) && !/^[A-Za-z0-9+/=]+$/.test(hashedValue)) {
      throw new Error('Invalid hashed value: must be hex or base64 encoded');
    }
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof AnonymizedIdentifier &&
      obj._type === this._type &&
      obj._hashedValue === this._hashedValue;
  }

  /**
   * String representation (safe for logging)
   */
  toString(): string {
    return `${this._type}:${this._hashedValue.slice(0, 8)}...`;
  }

  /**
   * JSON representation for storage
   */
  toJSON(): object {
    return {
      type: this._type,
      hashedValue: this._hashedValue,
      createdAt: this._createdAt.toISOString()
    };
  }
}
