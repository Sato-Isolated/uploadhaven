/**
 * 🔧 Admin User ID Value Object
 * 
 * Represents a unique identifier for administrative users.
 * Separate from regular users to maintain domain boundaries.
 * 
 * @domain admin
 * @pattern Value Object (DDD)
 * @privacy safe - contains only system-generated identifiers
 */

import { ValueObject } from '../../../../shared/domain/types';
import { randomUUID } from 'crypto';

/**
 * AdminUserId value object for administrative user identification
 */
export class AdminUserId extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validateAdminUserId(_value);
  }

  /**
   * Generate new admin user ID
   */
  static generate(): AdminUserId {
    return new AdminUserId(randomUUID());
  }

  /**
   * Create from existing string value
   */
  static fromString(value: string): AdminUserId {
    return new AdminUserId(value);
  }

  /**
   * Get string value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Check if this ID equals another ID
   */
  equals(other: ValueObject): boolean {
    return other instanceof AdminUserId && this._value === other._value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * Check if this is a system admin ID
   */
  isSystemAdmin(): boolean {
    return this._value.startsWith('system-');
  }

  /**
   * Create system admin ID
   */
  static createSystemAdmin(): AdminUserId {
    return new AdminUserId(`system-${randomUUID()}`);
  }

  /**
   * Validate admin user ID format
   */
  private validateAdminUserId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('AdminUserId must be a non-empty string');
    }

    // Accept UUIDs or system admin IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const systemAdminRegex = /^system-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value) && !systemAdminRegex.test(value)) {
      throw new Error('AdminUserId must be a valid UUID or system admin ID');
    }
  }

  /**
   * Get validation rules for this value object
   */
  static getValidationRules() {
    return {
      required: true,
      type: 'string',
      pattern: '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|system-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$',
      description: 'Unique identifier for administrative users (UUID or system admin format)'
    };
  }
}
