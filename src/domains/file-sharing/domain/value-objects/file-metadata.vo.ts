/**
 * FileMetadata Value Object - Privacy-safe file metadata
 * 
 * Represents minimal metadata about a file that is safe to store server-side.
 * Excludes all sensitive information like original filename, MIME type, etc.
 * 
 * @domain file-sharing
 * @pattern Value Object (DDD)
 * @privacy minimal data - only size and timestamps
 */

/**
 * FileMetadata value object containing only privacy-safe metadata
 * 
 * Privacy principles:
 * - Only stores file size and timestamps
 * - No original filename, MIME type, or user agent
 * - No metadata that could identify content or user
 */
export class FileMetadata {
  private constructor(
    private readonly _size: number,
    private readonly _createdAt: Date
  ) {
    this.validateSize(_size);
    this.validateCreatedAt(_createdAt);
  }

  /**
   * Create minimal metadata for a new file
   */
  static createMinimal(size: number): FileMetadata {
    return new FileMetadata(size, new Date());
  }

  /**
   * Create metadata from stored data (for repository operations)
   */
  static createFromStored(size: number, createdAt: Date): FileMetadata {
    return new FileMetadata(size, createdAt);
  }

  /**
   * Validate file size
   */
  private validateSize(size: number): void {
    if (!Number.isInteger(size) || size < 0) {
      throw new Error('File size must be a non-negative integer');
    }

    // Maximum file size: 100MB
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }
  }

  /**
   * Validate creation date
   */
  private validateCreatedAt(createdAt: Date): void {
    if (!(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
      throw new Error('CreatedAt must be a valid Date');
    }

    const now = new Date();
    const maxFutureOffset = 60 * 1000; // 1 minute tolerance for clock skew

    if (createdAt.getTime() > now.getTime() + maxFutureOffset) {
      throw new Error('CreatedAt cannot be in the future');
    }
  }

  // =============================================================================
  // Accessors
  // =============================================================================

  get size(): number {
    return this._size;
  }

  get createdAt(): Date {
    return new Date(this._createdAt); // Return copy to maintain immutability
  }

  // =============================================================================
  // Business Logic
  // =============================================================================

  /**
   * Get human-readable file size
   */
  getHumanReadableSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this._size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  /**
   * Check if file is considered large (>10MB)
   */
  isLargeFile(): boolean {
    return this._size > 10 * 1024 * 1024;
  }

  /**
   * Get age of the file in milliseconds
   */
  getAgeInMs(): number {
    return Date.now() - this._createdAt.getTime();
  }

  /**
   * Get age of the file in hours
   */
  getAgeInHours(): number {
    return this.getAgeInMs() / (1000 * 60 * 60);
  }

  // =============================================================================
  // Value Object Methods
  // =============================================================================

  /**
   * Check equality with another FileMetadata
   */
  equals(other: FileMetadata): boolean {
    return this._size === other._size &&
      this._createdAt.getTime() === other._createdAt.getTime();
  }

  /**
   * String representation
   */
  toString(): string {
    return `FileMetadata{ size: ${this.getHumanReadableSize()}, created: ${this._createdAt.toISOString()} }`;
  }

  /**
   * JSON serialization for storage
   */
  toJSON(): {
    size: number;
    createdAt: string;
  } {
    return {
      size: this._size,
      createdAt: this._createdAt.toISOString(),
    };
  }

  /**
   * Create from JSON (for deserialization)
   */
  static fromJSON(data: { size: number; createdAt: string }): FileMetadata {
    return new FileMetadata(data.size, new Date(data.createdAt));
  }
}
