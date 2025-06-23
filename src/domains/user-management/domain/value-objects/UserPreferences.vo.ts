/**
 * 🔐 UserPreferences Value Object - Privacy-Aware User Settings
 * 
 * Represents user preferences and settings.
 * Privacy-safe: Contains only non-sensitive preference data.
 * 
 * @domain user-management
 * @pattern Value Object (DDD)
 * @privacy zero-knowledge - preferences only, no personal data
 */

import { ValueObject } from '../../../../shared/domain/types';

export interface UserPreferencesData {
  readonly language: 'en' | 'fr' | 'es';
  readonly theme: 'light' | 'dark' | 'system';
  readonly emailNotifications: boolean;
  readonly fileRetentionDays: number;      // Default TTL for user's files
  readonly maxDownloadsDefault: number;    // Default download limit
  readonly autoDeleteEnabled: boolean;     // Auto-delete expired files
  readonly privacyMode: 'standard' | 'enhanced'; // Privacy level preference
  readonly analyticsOptIn: boolean;        // Anonymous usage analytics
}

/**
 * UserPreferences value object for storing user settings
 */
export class UserPreferences extends ValueObject implements UserPreferencesData {
  constructor(
    public readonly language: 'en' | 'fr' | 'es',
    public readonly theme: 'light' | 'dark' | 'system',
    public readonly emailNotifications: boolean,
    public readonly fileRetentionDays: number,
    public readonly maxDownloadsDefault: number,
    public readonly autoDeleteEnabled: boolean,
    public readonly privacyMode: 'standard' | 'enhanced',
    public readonly analyticsOptIn: boolean
  ) {
    super();
    this.validatePreferences();
  }

  /**
   * Create default preferences
   */
  static defaults(): UserPreferences {
    return new UserPreferences(
      'en',           // Default language
      'system',       // Respect system theme preference
      true,           // Email notifications enabled
      7,              // 7-day default retention
      10,             // 10 downloads default
      true,           // Auto-delete enabled for privacy
      'standard',     // Standard privacy mode
      false           // Analytics opt-out by default (privacy-first)
    );
  }

  /**
   * Create from stored data
   */
  static fromData(data: UserPreferencesData): UserPreferences {
    return new UserPreferences(
      data.language,
      data.theme,
      data.emailNotifications,
      data.fileRetentionDays,
      data.maxDownloadsDefault,
      data.autoDeleteEnabled,
      data.privacyMode,
      data.analyticsOptIn
    );
  }

  /**
   * Update preferences with partial data
   */
  update(updates: Partial<UserPreferencesData>): UserPreferences {
    return new UserPreferences(
      updates.language ?? this.language,
      updates.theme ?? this.theme,
      updates.emailNotifications ?? this.emailNotifications,
      updates.fileRetentionDays ?? this.fileRetentionDays,
      updates.maxDownloadsDefault ?? this.maxDownloadsDefault,
      updates.autoDeleteEnabled ?? this.autoDeleteEnabled,
      updates.privacyMode ?? this.privacyMode,
      updates.analyticsOptIn ?? this.analyticsOptIn
    );
  }

  /**
   * Update language preference
   */
  setLanguage(language: 'en' | 'fr' | 'es'): UserPreferences {
    return this.update({ language });
  }

  /**
   * Update theme preference
   */
  setTheme(theme: 'light' | 'dark' | 'system'): UserPreferences {
    return this.update({ theme });
  }

  /**
   * Enable/disable email notifications
   */
  setEmailNotifications(enabled: boolean): UserPreferences {
    return this.update({ emailNotifications: enabled });
  }

  /**
   * Set default file retention period
   */
  setFileRetentionDays(days: number): UserPreferences {
    if (days < 1 || days > 30) {
      throw new Error('File retention days must be between 1 and 30');
    }
    return this.update({ fileRetentionDays: days });
  }

  /**
   * Set default download limit
   */
  setMaxDownloadsDefault(limit: number): UserPreferences {
    if (limit < 1 || limit > 1000) {
      throw new Error('Max downloads must be between 1 and 1000');
    }
    return this.update({ maxDownloadsDefault: limit });
  }

  /**
   * Enable enhanced privacy mode
   */
  enableEnhancedPrivacy(): UserPreferences {
    return this.update({
      privacyMode: 'enhanced',
      analyticsOptIn: false,      // Disable analytics in enhanced mode
      autoDeleteEnabled: true     // Force auto-delete in enhanced mode
    });
  }

  /**
   * Check if user prefers enhanced privacy
   */
  isEnhancedPrivacyMode(): boolean {
    return this.privacyMode === 'enhanced';
  }

  /**
   * Check if analytics are allowed
   */
  allowsAnalytics(): boolean {
    return this.analyticsOptIn && this.privacyMode !== 'enhanced';
  }

  /**
   * Get effective file retention (considers privacy mode)
   */
  getEffectiveRetentionDays(): number {
    // Enhanced privacy mode limits retention to 7 days max
    if (this.privacyMode === 'enhanced') {
      return Math.min(this.fileRetentionDays, 7);
    }
    return this.fileRetentionDays;
  }

  /**
   * Validate preferences
   */
  private validatePreferences(): void {
    // Language validation
    const validLanguages = ['en', 'fr', 'es'];
    if (!validLanguages.includes(this.language)) {
      throw new Error(`Invalid language: ${this.language}`);
    }

    // Theme validation
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(this.theme)) {
      throw new Error(`Invalid theme: ${this.theme}`);
    }

    // File retention validation
    if (!Number.isInteger(this.fileRetentionDays) ||
      this.fileRetentionDays < 1 ||
      this.fileRetentionDays > 30) {
      throw new Error('File retention days must be an integer between 1 and 30');
    }

    // Max downloads validation
    if (!Number.isInteger(this.maxDownloadsDefault) ||
      this.maxDownloadsDefault < 1 ||
      this.maxDownloadsDefault > 1000) {
      throw new Error('Max downloads default must be an integer between 1 and 1000');
    }

    // Privacy mode validation
    const validPrivacyModes = ['standard', 'enhanced'];
    if (!validPrivacyModes.includes(this.privacyMode)) {
      throw new Error(`Invalid privacy mode: ${this.privacyMode}`);
    }

    // Boolean validations
    if (typeof this.emailNotifications !== 'boolean') {
      throw new Error('Email notifications must be a boolean');
    }
    if (typeof this.autoDeleteEnabled !== 'boolean') {
      throw new Error('Auto delete enabled must be a boolean');
    }
    if (typeof this.analyticsOptIn !== 'boolean') {
      throw new Error('Analytics opt-in must be a boolean');
    }
  }

  /**
   * Convert to storage format
   */
  toData(): UserPreferencesData {
    return {
      language: this.language,
      theme: this.theme,
      emailNotifications: this.emailNotifications,
      fileRetentionDays: this.fileRetentionDays,
      maxDownloadsDefault: this.maxDownloadsDefault,
      autoDeleteEnabled: this.autoDeleteEnabled,
      privacyMode: this.privacyMode,
      analyticsOptIn: this.analyticsOptIn
    };
  }

  /**
   * Equality check
   */
  equals(obj: ValueObject): boolean {
    return obj instanceof UserPreferences &&
      obj.language === this.language &&
      obj.theme === this.theme &&
      obj.emailNotifications === this.emailNotifications &&
      obj.fileRetentionDays === this.fileRetentionDays &&
      obj.maxDownloadsDefault === this.maxDownloadsDefault &&
      obj.autoDeleteEnabled === this.autoDeleteEnabled &&
      obj.privacyMode === this.privacyMode &&
      obj.analyticsOptIn === this.analyticsOptIn;
  }

  /**
   * String representation
   */
  toString(): string {
    return `UserPreferences[lang=${this.language}, theme=${this.theme}, privacy=${this.privacyMode}]`;
  }
}
