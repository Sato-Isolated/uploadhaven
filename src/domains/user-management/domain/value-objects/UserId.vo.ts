/**
 * 🔐 UserId Value Object - Unique User Identifier
 * 
 * Represents a unique, anonymous user identifier.
 * Privacy-safe: Contains no personal information.
 * 
 * @domain user-management
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - anonymous identifier
 */

import { ValueObject } from '../../../../shared/domain/types';
import { randomUUID } from 'crypto';

/**
 * UserId value object for user identification
 */
export class UserId extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validateUserId(_value);
  }

  /**
   * Get the user ID value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Generate a new unique user ID
   */
  static generate(): UserId {
    return new UserId(randomUUID());
  }

  /**
   * Create UserId from string
   */
  static fromString(value: string): UserId {
    return new UserId(value);
  }

  /**
   * Validate user ID format
   */
  private validateUserId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('UserId must be a non-empty string');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('UserId must be a valid UUID');
    }
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof UserId && obj._value === this._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }
}
