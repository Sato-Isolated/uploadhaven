/**
 * 🔐 User Entity - Privacy-First User Management
 * 
 * Represents a user account with encrypted personal data.
 * Follows zero-knowledge principles: sensitive data always encrypted.
 * 
 * @domain user-management
 * @pattern Entity (DDD)
 * @privacy zero-knowledge - all PII encrypted, only hashes stored for lookup
 */

import { Entity } from '../../../../shared/domain/types';
import { UserId } from '../value-objects/UserId.vo';
import { EmailHash } from '../value-objects/EmailHash.vo';
import { EncryptedField } from '../value-objects/EncryptedField.vo';
import { AccountStatus } from '../value-objects/AccountStatus.vo';
import { UserPreferences } from '../value-objects/UserPreferences.vo';

export interface UserData {
  readonly id: string;
  readonly emailHash: string;         // SHA-256 hash for lookup only
  readonly encryptedEmail: EncryptedField;
  readonly encryptedName?: EncryptedField;
  readonly accountStatus: AccountStatus;
  readonly preferences: UserPreferences;
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
  readonly emailVerifiedAt?: Date;
  readonly deletedAt?: Date;          // Soft deletion for GDPR
}

/**
 * User aggregate root - handles encrypted user data
 */
export class User extends Entity<string> {
  private constructor(
    private readonly _userId: UserId,
    private readonly _emailHash: EmailHash,
    private _encryptedEmail: EncryptedField,
    private _encryptedName?: EncryptedField,
    private _accountStatus: AccountStatus = AccountStatus.active(),
    private _preferences: UserPreferences = UserPreferences.defaults(),
    private readonly _createdAt: Date = new Date(),
    private _lastLoginAt?: Date,
    private _emailVerifiedAt?: Date,
    private _deletedAt?: Date
  ) {
    super(_userId.value);
  }

  // =============================================================================
  // Factory Methods
  // =============================================================================

  /**
   * Create new user with encrypted personal data
   */
  static async createEncrypted(
    email: string,
    name?: string,
    encryptionKey?: string // Optional client-provided key
  ): Promise<User> {
    // Generate unique user ID
    const userId = UserId.generate();

    // Create email hash for lookups (privacy-preserving)
    const emailHash = await EmailHash.fromEmail(email);

    // Encrypt email (always required)
    const encryptedEmail = await EncryptedField.encrypt(email, encryptionKey);

    // Encrypt name if provided
    const encryptedName = name
      ? await EncryptedField.encrypt(name, encryptionKey)
      : undefined;

    return new User(
      userId,
      emailHash,
      encryptedEmail,
      encryptedName,
      AccountStatus.pendingVerification(), // New accounts start unverified
      UserPreferences.defaults(),
      new Date()
    );
  }

  /**
   * Reconstruct user from storage data
   */
  static fromData(data: UserData): User {
    return new User(
      UserId.fromString(data.id),
      EmailHash.fromString(data.emailHash),
      data.encryptedEmail,
      data.encryptedName,
      data.accountStatus,
      data.preferences,
      data.createdAt,
      data.lastLoginAt,
      data.emailVerifiedAt,
      data.deletedAt
    );
  }

  // =============================================================================
  // Getters
  // =============================================================================
  get id(): string {
    return this._userId.value;
  }

  get emailHash(): string {
    return this._emailHash.value;
  }

  get encryptedEmail(): EncryptedField {
    return this._encryptedEmail;
  }

  get encryptedName(): EncryptedField | undefined {
    return this._encryptedName;
  }

  get accountStatus(): AccountStatus {
    return this._accountStatus;
  }

  get preferences(): UserPreferences {
    return this._preferences;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get emailVerifiedAt(): Date | undefined {
    return this._emailVerifiedAt;
  }

  get isEmailVerified(): boolean {
    return this._emailVerifiedAt !== undefined;
  }

  get isActive(): boolean {
    return this._accountStatus.isActive() && !this.isDeleted;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  // =============================================================================
  // Business Logic
  // =============================================================================

  /**
   * Record successful login
   */
  recordLogin(): void {
    this._lastLoginAt = new Date();

    // Activate account on first successful login if pending
    if (this._accountStatus.isPendingVerification()) {
      this._accountStatus = AccountStatus.active();
    }
  }

  /**
   * Verify email address
   */
  verifyEmail(): void {
    if (this.isEmailVerified) {
      throw new Error('Email already verified');
    }

    this._emailVerifiedAt = new Date();

    // Activate account if it was pending verification
    if (this._accountStatus.isPendingVerification()) {
      this._accountStatus = AccountStatus.active();
    }
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this._preferences = this._preferences.update(preferences);
  }

  /**
   * Update encrypted name
   */
  async updateName(newName: string, encryptionKey?: string): Promise<void> {
    this._encryptedName = await EncryptedField.encrypt(newName, encryptionKey);
  }
  /**
   * Update encrypted email (creates new User instance due to readonly emailHash)
   */
  async updateEmail(newEmail: string, encryptionKey?: string): Promise<User> {
    // Create new email hash for lookup
    const newEmailHash = await EmailHash.fromEmail(newEmail);

    // Encrypt new email
    const newEncryptedEmail = await EncryptedField.encrypt(newEmail, encryptionKey);

    // Create new User instance with updated email (immutable pattern)
    return new User(
      this._userId,
      newEmailHash,
      newEncryptedEmail,
      this._encryptedName,
      this._accountStatus,
      this._preferences,
      this._createdAt,
      this._lastLoginAt,
      undefined, // Reset email verification
      this._deletedAt
    );
  }

  /**
   * Suspend user account
   */
  suspend(reason?: string): void {
    this._accountStatus = AccountStatus.suspended(reason);
  }

  /**
   * Reactivate suspended account
   */
  reactivate(): void {
    if (!this._accountStatus.isSuspended()) {
      throw new Error('Account is not suspended');
    }

    this._accountStatus = AccountStatus.active();
  }

  /**
   * Soft delete user account (GDPR compliance)
   */
  softDelete(): void {
    this._deletedAt = new Date();
    this._accountStatus = AccountStatus.deleted();
  }

  /**
   * Check if user can access the platform
   */
  canAccess(): boolean {
    return this.isActive && this.isEmailVerified;
  }
  /**
   * Get user data for storage
   */
  toData(): UserData {
    return {
      id: this.id,
      emailHash: this.emailHash,
      encryptedEmail: this.encryptedEmail,
      encryptedName: this.encryptedName,
      accountStatus: this.accountStatus,
      preferences: this.preferences,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      emailVerifiedAt: this.emailVerifiedAt,
      deletedAt: this.deletedAt
    };
  }

  // =============================================================================
  // Privacy & Security
  // =============================================================================

  /**
   * Decrypt email (requires encryption key)
   */
  async decryptEmail(encryptionKey: string): Promise<string> {
    return await this._encryptedEmail.decrypt(encryptionKey);
  }

  /**
   * Decrypt name (requires encryption key)
   */
  async decryptName(encryptionKey: string): Promise<string | undefined> {
    if (!this._encryptedName) return undefined;
    return await this._encryptedName.decrypt(encryptionKey);
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportData(encryptionKey: string): Promise<{
    id: string;
    email: string;
    name?: string;
    accountStatus: string;
    preferences: UserPreferences;
    createdAt: Date;
    lastLoginAt?: Date;
    emailVerifiedAt?: Date;
  }> {
    return {
      id: this.id,
      email: await this.decryptEmail(encryptionKey),
      name: await this.decryptName(encryptionKey),
      accountStatus: this.accountStatus.toString(),
      preferences: this.preferences,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      emailVerifiedAt: this.emailVerifiedAt
    };
  }
  /**
   * Validate user entity integrity
   */
  private validateInvariant(): void {
    if (!this._userId || !this._emailHash || !this._encryptedEmail) {
      throw new Error('User entity invariant violation: missing required fields');
    }

    if (this._deletedAt && !this._accountStatus.isDeleted()) {
      throw new Error('User entity invariant violation: deleted user must have deleted status');
    }
  }
}
