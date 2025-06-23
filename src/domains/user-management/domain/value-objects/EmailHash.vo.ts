/**
 * 🔐 EmailHash Value Object - Privacy-Preserving Email Lookup
 * 
 * Represents a SHA-256 hash of email address for database lookups.
 * Privacy-safe: Allows email-based lookups without storing plaintext.
 * 
 * @domain user-management
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - only hash stored, original email never persisted
 */

import crypto from 'crypto';
import { ValueObject } from '../../../../shared/domain/types';

/**
 * EmailHash value object for privacy-preserving email lookups
 */
export class EmailHash extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validateEmailHash(_value);
  }

  /**
   * Get the email hash value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Create EmailHash from plain email address
   */
  static async fromEmail(email: string): Promise<EmailHash> {
    // Validate email format
    if (!EmailHash.isValidEmail(email)) {
      throw new Error('Invalid email address format');
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Create SHA-256 hash with salt
    const saltedEmail = `uploadhaven_email_salt_${normalizedEmail}`;
    const hash = crypto.createHash('sha256');
    hash.update(saltedEmail);
    const emailHash = hash.digest('hex');

    return new EmailHash(emailHash);
  }

  /**
   * Create EmailHash from existing hash string
   */
  static fromString(value: string): EmailHash {
    return new EmailHash(value);
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate email hash format
   */
  private validateEmailHash(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('EmailHash must be a non-empty string');
    }

    // Validate SHA-256 hash format (64 hex characters)
    if (!/^[a-f0-9]{64}$/.test(value)) {
      throw new Error('EmailHash must be a valid SHA-256 hash (64 hex characters)');
    }
  }

  /**
   * Check if this hash matches a given email
   */
  async matchesEmail(email: string): Promise<boolean> {
    try {
      const emailHash = await EmailHash.fromEmail(email);
      return this.equals(emailHash);
    } catch {
      return false;
    }
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof EmailHash && obj._value === this._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }
}
