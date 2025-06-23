/**
 * DownloadLimits Value Object - File download restrictions
 * 
 * Represents download limits and access control for shared files.
 * Prevents abuse while maintaining anonymous access.
 * 
 * @domain file-sharing
 * @pattern Value Object (DDD)
 * @privacy no sensitive data - only access counters
 */

/**
 * DownloadLimits value object for managing file access restrictions
 * 
 * Key features:
 * - Immutable download limits
 * - Abuse prevention through access control
 * - Anonymous-friendly (no user tracking)
 * - Privacy-safe (no sensitive data)
 */
export class DownloadLimits {
  private constructor(private readonly _maxDownloads: number) {
    this.validateMaxDownloads(_maxDownloads);
  }

  /**
   * Create download limits
   */
  static create(maxDownloads: number): DownloadLimits {
    return new DownloadLimits(maxDownloads);
  }

  /**
   * Create default download limits (10 downloads)
   */
  static createDefault(): DownloadLimits {
    return new DownloadLimits(10);
  }

  /**
   * Create high-limit access (100 downloads)
   */
  static createHighLimit(): DownloadLimits {
    return new DownloadLimits(100);
  }

  /**
   * Create unlimited access (1000 downloads - practical limit)
   */
  static createUnlimited(): DownloadLimits {
    return new DownloadLimits(1000);
  }

  /**
   * Validate maximum downloads
   */
  private validateMaxDownloads(maxDownloads: number): void {
    if (!Number.isInteger(maxDownloads) || maxDownloads <= 0) {
      throw new Error('Max downloads must be a positive integer');
    }

    if (maxDownloads > 1000) {
      throw new Error('Max downloads cannot exceed 1000');
    }
  }

  // =============================================================================
  // Accessors
  // =============================================================================

  get maxDownloads(): number {
    return this._maxDownloads;
  }

  // =============================================================================
  // Business Logic
  // =============================================================================

  /**
   * Check if download count is within limits
   */
  isWithinLimits(currentDownloads: number): boolean {
    return currentDownloads < this._maxDownloads;
  }

  /**
   * Calculate remaining downloads
   */
  getRemainingDownloads(currentDownloads: number): number {
    return Math.max(0, this._maxDownloads - currentDownloads);
  }

  /**
   * Check if downloads are exhausted
   */
  areDownloadsExhausted(currentDownloads: number): boolean {
    return currentDownloads >= this._maxDownloads;
  }

  /**
   * Get download limit tier for display
   */
  getLimitTier(): 'low' | 'medium' | 'high' | 'unlimited' {
    if (this._maxDownloads <= 10) return 'low';
    if (this._maxDownloads <= 50) return 'medium';
    if (this._maxDownloads <= 100) return 'high';
    return 'unlimited';
  }

  /**
   * Get human-readable limit description
   */
  getHumanReadableLimit(): string {
    switch (this.getLimitTier()) {
      case 'low':
        return `${this._maxDownloads} downloads`;
      case 'medium':
        return `${this._maxDownloads} downloads`;
      case 'high':
        return `${this._maxDownloads} downloads`;
      case 'unlimited':
        return 'Unlimited downloads';
      default:
        return `${this._maxDownloads} downloads`;
    }
  }

  /**
   * Check if limit is approaching (80% used)
   */
  isLimitApproaching(currentDownloads: number): boolean {
    const usagePercentage = (currentDownloads / this._maxDownloads) * 100;
    return usagePercentage >= 80;
  }

  /**
   * Get usage percentage
   */
  getUsagePercentage(currentDownloads: number): number {
    return Math.min(100, (currentDownloads / this._maxDownloads) * 100);
  }

  /**
   * Check if this is a generous limit (>50 downloads)
   */
  isGenerousLimit(): boolean {
    return this._maxDownloads > 50;
  }

  /**
   * Check if this is a restrictive limit (<=5 downloads)
   */
  isRestrictiveLimit(): boolean {
    return this._maxDownloads <= 5;
  }

  // =============================================================================
  // Business Rules
  // =============================================================================

  /**
   * Get recommended limit based on file size
   */
  static getRecommendedLimit(fileSizeBytes: number): DownloadLimits {
    // Large files get fewer downloads to prevent abuse
    if (fileSizeBytes > 50 * 1024 * 1024) { // >50MB
      return DownloadLimits.create(5);
    } else if (fileSizeBytes > 10 * 1024 * 1024) { // >10MB
      return DownloadLimits.create(10);
    } else {
      return DownloadLimits.createDefault(); // 10 downloads
    }
  }

  /**
   * Get limit based on account tier
   */
  static getLimitForTier(tier: 'anonymous' | 'account' | 'premium'): DownloadLimits {
    switch (tier) {
      case 'anonymous':
        return DownloadLimits.createDefault(); // 10
      case 'account':
        return DownloadLimits.createHighLimit(); // 100
      case 'premium':
        return DownloadLimits.createUnlimited(); // 1000
      default:
        return DownloadLimits.createDefault();
    }
  }

  // =============================================================================
  // Value Object Methods
  // =============================================================================

  /**
   * Check equality with another DownloadLimits
   */
  equals(other: DownloadLimits): boolean {
    return this._maxDownloads === other._maxDownloads;
  }

  /**
   * String representation
   */
  toString(): string {
    return `DownloadLimits{ max: ${this._maxDownloads}, tier: ${this.getLimitTier()} }`;
  }

  /**
   * JSON serialization
   */
  toJSON(): {
    maxDownloads: number;
    tier: string;
    description: string;
  } {
    return {
      maxDownloads: this._maxDownloads,
      tier: this.getLimitTier(),
      description: this.getHumanReadableLimit(),
    };
  }

  /**
   * Create from JSON (for deserialization)
   */
  static fromJSON(data: { maxDownloads: number }): DownloadLimits {
    return new DownloadLimits(data.maxDownloads);
  }
}
