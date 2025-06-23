/**
 * PrivacyLevel Value Object - Privacy Compliance Level Classification
 * 
 * Represents the privacy compliance level of data being processed.
 * Used to ensure appropriate handling of data based on its sensitivity.
 * 
 * @domain privacy
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - classifies privacy levels without exposing data
 */

import { ValueObject } from '../../../../shared/domain/types';

/**
 * Supported privacy levels
 */
export type PrivacyLevelValue =
  | 'public'        // No personal data, safe for public access
  | 'anonymized'    // Personal data removed or anonymized
  | 'hashed'        // Sensitive data hashed with salt
  | 'encrypted'     // Data encrypted with proper key management
  | 'restricted'    // Highly sensitive, restricted access
  | 'non-compliant'; // Does not meet privacy standards

/**
 * Privacy level descriptions and compliance information
 */
interface PrivacyLevelInfo {
  readonly description: string;
  readonly isCompliant: boolean;
  readonly allowsStorage: boolean;
  readonly requiresConsent: boolean;
  readonly retentionPeriod: number; // Days
}

/**
 * Privacy level configuration
 */
const PRIVACY_LEVELS: Record<PrivacyLevelValue, PrivacyLevelInfo> = {
  public: {
    description: 'No personal data, safe for public access',
    isCompliant: true,
    allowsStorage: true,
    requiresConsent: false,
    retentionPeriod: 365 // 1 year
  },
  anonymized: {
    description: 'Personal data removed or anonymized',
    isCompliant: true,
    allowsStorage: true,
    requiresConsent: false,
    retentionPeriod: 180 // 6 months
  },
  hashed: {
    description: 'Sensitive data hashed with salt',
    isCompliant: true,
    allowsStorage: true,
    requiresConsent: false,
    retentionPeriod: 90 // 3 months
  },
  encrypted: {
    description: 'Data encrypted with proper key management',
    isCompliant: true,
    allowsStorage: true,
    requiresConsent: true,
    retentionPeriod: 30 // 1 month
  },
  restricted: {
    description: 'Highly sensitive, restricted access',
    isCompliant: true,
    allowsStorage: false,
    requiresConsent: true,
    retentionPeriod: 7 // 1 week
  },
  'non-compliant': {
    description: 'Does not meet privacy standards',
    isCompliant: false,
    allowsStorage: false,
    requiresConsent: false,
    retentionPeriod: 0 // Immediate deletion required
  }
};

/**
 * PrivacyLevel value object for privacy compliance classification
 */
export class PrivacyLevel extends ValueObject {
  private constructor(private readonly _value: PrivacyLevelValue) {
    super();
    this.validatePrivacyLevel(_value);
  }

  /**
   * Get the privacy level value
   */
  get value(): PrivacyLevelValue {
    return this._value;
  }

  /**
   * Get privacy level information
   */
  get info(): PrivacyLevelInfo {
    return PRIVACY_LEVELS[this._value];
  }

  /**
   * Check if this privacy level is compliant
   */
  get isCompliant(): boolean {
    return this.info.isCompliant;
  }

  /**
   * Check if storage is allowed for this privacy level
   */
  get allowsStorage(): boolean {
    return this.info.allowsStorage;
  }

  /**
   * Get retention period in days
   */
  get retentionPeriodDays(): number {
    return this.info.retentionPeriod;
  }

  /**
   * Check if this privacy level requires user consent
   */
  get requiresConsent(): boolean {
    return this.info.requiresConsent;
  }

  /**
   * Create PrivacyLevel from string
   */
  static fromString(value: string): PrivacyLevel {
    if (!this.isValidPrivacyLevel(value)) {
      throw new Error(`Invalid privacy level: ${value}`);
    }
    return new PrivacyLevel(value as PrivacyLevelValue);
  }

  /**
   * Create public privacy level
   */
  static public(): PrivacyLevel {
    return new PrivacyLevel('public');
  }

  /**
   * Create anonymized privacy level
   */
  static anonymized(): PrivacyLevel {
    return new PrivacyLevel('anonymized');
  }

  /**
   * Create hashed privacy level
   */
  static hashed(): PrivacyLevel {
    return new PrivacyLevel('hashed');
  }

  /**
   * Create encrypted privacy level
   */
  static encrypted(): PrivacyLevel {
    return new PrivacyLevel('encrypted');
  }

  /**
   * Create restricted privacy level
   */
  static restricted(): PrivacyLevel {
    return new PrivacyLevel('restricted');
  }

  /**
   * Create non-compliant privacy level
   */
  static nonCompliant(): PrivacyLevel {
    return new PrivacyLevel('non-compliant');
  }
  /**
   * Create privacy level for security events based on severity
   */
  static forSecurityEvent(severity: 'low' | 'medium' | 'high' | 'critical'): PrivacyLevel {
    switch (severity) {
      case 'low':
        return PrivacyLevel.anonymized();
      case 'medium':
        return PrivacyLevel.hashed();
      case 'high':
        return PrivacyLevel.encrypted();
      case 'critical':
        return PrivacyLevel.restricted();
      default:
        return PrivacyLevel.public();
    }
  }

  /**
   * Determine privacy level based on data content
   */
  static fromDataContent(data: any): PrivacyLevel {
    if (!data || typeof data !== 'object') {
      return PrivacyLevel.public();
    }

    const sensitiveFields = ['email', 'ip', 'session', 'user', 'password', 'token'];
    const hashedFields = ['hash', 'hashed', 'sha'];

    const keys = Object.keys(data).join(' ').toLowerCase();

    if (sensitiveFields.some(field => keys.includes(field))) {
      if (hashedFields.some(field => keys.includes(field))) {
        return PrivacyLevel.hashed();
      }
      return PrivacyLevel.nonCompliant();
    }

    return PrivacyLevel.public();
  }

  /**
   * Compare privacy levels (higher level = more restrictive)
   */
  isMoreRestrictiveThan(other: PrivacyLevel): boolean {
    const levelOrder: PrivacyLevelValue[] = [
      'public', 'anonymized', 'hashed', 'encrypted', 'restricted', 'non-compliant'
    ];

    const thisIndex = levelOrder.indexOf(this._value);
    const otherIndex = levelOrder.indexOf(other._value);

    return thisIndex > otherIndex;
  }

  /**
   * Validate privacy level value
   */
  private validatePrivacyLevel(value: string): void {
    if (!PrivacyLevel.isValidPrivacyLevel(value)) {
      throw new Error(`Invalid privacy level: ${value}`);
    }
  }

  /**
   * Check if value is a valid privacy level
   */
  private static isValidPrivacyLevel(value: string): value is PrivacyLevelValue {
    return Object.keys(PRIVACY_LEVELS).includes(value);
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof PrivacyLevel && obj._value === this._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }
}
