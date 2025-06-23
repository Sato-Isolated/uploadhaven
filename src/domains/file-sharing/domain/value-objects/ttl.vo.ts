/**
 * TTL (Time-To-Live) Value Object - File expiration management
 * 
 * Represents the time-to-live for shared files.
 * Handles automatic expiration and cleanup scheduling.
 * 
 * @domain file-sharing
 * @pattern Value Object (DDD)
 * @privacy no sensitive data - only timestamps
 */

/**
 * TTL value object for managing file expiration
 * 
 * Key features:
 * - Immutable expiration time
 * - Automatic expiration checking
 * - Privacy-safe (no sensitive data)
 * - Supports extension (if business rules allow)
 */
export class TTL {
  private constructor(private _expiresAt: Date) {
    this.validateExpiresAt(_expiresAt);
  }

  /**
   * Create TTL from hours (most common use case)
   */
  static createFromHours(hours: number): TTL {
    if (!Number.isInteger(hours) || hours <= 0) {
      throw new Error('TTL hours must be a positive integer');
    }

    if (hours > 168) { // 7 days maximum
      throw new Error('TTL cannot exceed 168 hours (7 days)');
    }

    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    return new TTL(expiresAt);
  }

  /**
   * Create TTL from specific expiration date
   */
  static fromExpirationDate(expiresAt: Date): TTL {
    return new TTL(new Date(expiresAt));
  }

  /**
   * Create TTL with default duration (24 hours)
   */
  static createDefault(): TTL {
    return TTL.createFromHours(24);
  }

  /**
   * Validate expiration date
   */
  private validateExpiresAt(expiresAt: Date): void {
    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new Error('ExpiresAt must be a valid Date');
    }

    const now = new Date();
    if (expiresAt.getTime() <= now.getTime()) {
      throw new Error('ExpiresAt must be in the future');
    }

    // Maximum TTL: 7 days
    const maxTTL = 7 * 24 * 60 * 60 * 1000;
    if (expiresAt.getTime() > now.getTime() + maxTTL) {
      throw new Error('TTL cannot exceed 7 days');
    }
  }

  // =============================================================================
  // Accessors
  // =============================================================================

  get expiresAt(): Date {
    return new Date(this._expiresAt); // Return copy to maintain immutability
  }

  // =============================================================================
  // Business Logic
  // =============================================================================

  /**
   * Check if the TTL has expired
   */
  isExpired(): boolean {
    return Date.now() >= this._expiresAt.getTime();
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingMs(): number {
    const remaining = this._expiresAt.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get remaining time in hours
   */
  getRemainingHours(): number {
    return this.getRemainingMs() / (1000 * 60 * 60);
  }

  /**
   * Get remaining time in minutes
   */
  getRemainingMinutes(): number {
    return this.getRemainingMs() / (1000 * 60);
  }

  /**
   * Check if TTL is expiring soon (within 1 hour)
   */
  isExpiringSoon(): boolean {
    return this.getRemainingHours() <= 1 && !this.isExpired();
  }

  /**
   * Get human-readable remaining time
   */
  getHumanReadableRemaining(): string {
    if (this.isExpired()) {
      return 'Expired';
    }

    const hours = Math.floor(this.getRemainingHours());
    const minutes = Math.floor(this.getRemainingMinutes() % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Extend TTL by additional hours (if business rules allow)
   */
  extend(additionalHours: number): TTL {
    if (!Number.isInteger(additionalHours) || additionalHours <= 0) {
      throw new Error('Additional hours must be a positive integer');
    }

    const newExpiresAt = new Date(this._expiresAt.getTime() + additionalHours * 60 * 60 * 1000);

    // Validate against maximum TTL
    const maxTTL = 7 * 24 * 60 * 60 * 1000;
    if (newExpiresAt.getTime() > Date.now() + maxTTL) {
      throw new Error('Extended TTL would exceed maximum allowed duration (7 days)');
    }

    this._expiresAt = newExpiresAt;
    return this;
  }

  /**
   * Get percentage of TTL elapsed (0-100)
   */
  getElapsedPercentage(): number {
    const now = Date.now();
    const created = this._expiresAt.getTime() - (24 * 60 * 60 * 1000); // Assume 24h default
    const elapsed = now - created;
    const total = this._expiresAt.getTime() - created;

    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  // =============================================================================
  // Value Object Methods
  // =============================================================================

  /**
   * Check equality with another TTL
   */
  equals(other: TTL): boolean {
    return this._expiresAt.getTime() === other._expiresAt.getTime();
  }

  /**
   * String representation
   */
  toString(): string {
    if (this.isExpired()) {
      return `TTL{ EXPIRED at ${this._expiresAt.toISOString()} }`;
    }
    return `TTL{ expires: ${this._expiresAt.toISOString()}, remaining: ${this.getHumanReadableRemaining()} }`;
  }

  /**
   * JSON serialization
   */
  toJSON(): {
    expiresAt: string;
    isExpired: boolean;
    remainingMs: number;
  } {
    return {
      expiresAt: this._expiresAt.toISOString(),
      isExpired: this.isExpired(),
      remainingMs: this.getRemainingMs(),
    };
  }

  /**
   * Create from JSON (for deserialization)
   */
  static fromJSON(data: { expiresAt: string }): TTL {
    return new TTL(new Date(data.expiresAt));
  }
}
