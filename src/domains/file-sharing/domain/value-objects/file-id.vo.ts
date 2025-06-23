/**
 * FileId Value Object - Unique identifier for shared files
 * 
 * Represents a unique, privacy-safe identifier for files in the system.
 * Uses cryptographically secure random generation.
 * 
 * @domain file-sharing
 * @pattern Value Object (DDD)
 * @privacy public identifier - no sensitive data
 */

/**
 * FileId value object for unique file identification
 * 
 * Key characteristics:
 * - Immutable: Cannot be changed after creation
 * - Unique: Cryptographically secure random generation
 * - Public: Safe to expose in URLs and APIs
 * - Anonymous: No correlation to user or content
 */
export class FileId {
  private constructor(private readonly _value: string) {
    this.validateFileId(_value);
  }

  /**
   * Generate a new unique file ID
   * Uses cryptographically secure random string
   */
  static generate(): FileId {
    // Generate 10-character ID using URL-safe characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const randomBytes = new Uint8Array(10);
    crypto.getRandomValues(randomBytes);

    const id = Array.from(randomBytes)
      .map(byte => chars[byte % chars.length])
      .join('');

    return new FileId(id);
  }

  /**
   * Create FileId from existing string (for repository operations)
   */
  static fromString(value: string): FileId {
    return new FileId(value);
  }

  /**
   * Validate file ID format
   */
  private validateFileId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('FileId must be a non-empty string');
    }

    if (value.length !== 10) {
      throw new Error('FileId must be exactly 10 characters long');
    }

    const validCharPattern = /^[A-Za-z0-9\-_]{10}$/;
    if (!validCharPattern.test(value)) {
      throw new Error('FileId contains invalid characters');
    }
  }

  /**
   * Get the string value of the file ID
   */
  get value(): string {
    return this._value;
  }

  /**
   * Check equality with another FileId
   */
  equals(other: FileId): boolean {
    return this._value === other._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this._value;
  }
}
