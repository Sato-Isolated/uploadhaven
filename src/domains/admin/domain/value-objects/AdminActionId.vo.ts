/**
 * 🔧 Admin Action ID Value Object
 * 
 * Represents a unique identifier for administrative actions.
 * 
 * @domain admin
 * @pattern Value Object (DDD)
 * @privacy safe - contains only system-generated identifiers
 */

import { ValueObject } from '../../../../shared/domain/types';
import { nanoid } from 'nanoid';

/**
 * AdminActionId value object for administrative action identification
 */
export class AdminActionId extends ValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validateAdminActionId(_value);
  }

  /**
   * Generate new admin action ID
   */
  static generate(): AdminActionId {
    return new AdminActionId(nanoid(12));
  }

  /**
   * Create from existing string value
   */
  static fromString(value: string): AdminActionId {
    return new AdminActionId(value);
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
    return other instanceof AdminActionId && this._value === other._value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * Validate admin action ID format
   */
  private validateAdminActionId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('AdminActionId must be a non-empty string');
    }

    if (value.length < 8 || value.length > 20) {
      throw new Error('AdminActionId must be between 8 and 20 characters');
    }

    // Validate format (alphanumeric, dashes, underscores allowed)
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new Error('AdminActionId must contain only alphanumeric characters, dashes, and underscores');
    }
  }

  /**
   * Get validation rules for this value object
   */
  static getValidationRules() {
    return {
      required: true,
      type: 'string',
      minLength: 8,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_-]+$',
      description: 'Unique identifier for administrative actions'
    };
  }
}
