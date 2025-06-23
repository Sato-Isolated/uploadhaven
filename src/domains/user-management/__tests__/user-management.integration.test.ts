/**
 * 🔐 User Management Domain Integration Test
 * 
 * Tests the core User Management domain functionality including
 * user creation, encryption, and privacy-first patterns.
 * 
 * @domain user-management
 * @pattern Integration Test (DDD)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../domain/entities/User.entity';
import { UserId } from '../domain/value-objects/UserId.vo';
import { EmailHash } from '../domain/value-objects/EmailHash.vo';
import { EncryptedField } from '../domain/value-objects/EncryptedField.vo';
import { AccountStatus } from '../domain/value-objects/AccountStatus.vo';
import { UserPreferences } from '../domain/value-objects/UserPreferences.vo';
import { RegisterUserUseCase } from '../application/usecases/RegisterUser.usecase';

// Mock repository for testing
class MockUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(userId: UserId): Promise<User | null> {
    return this.users.get(userId.value) || null;
  }

  async findByEmailHash(emailHash: EmailHash): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.emailHash === emailHash.value) {
        return user;
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const emailHash = await EmailHash.fromEmail(email);
    return this.findByEmailHash(emailHash);
  }

  async existsByEmailHash(emailHash: EmailHash): Promise<boolean> {
    return (await this.findByEmailHash(emailHash)) !== null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  async delete(userId: UserId): Promise<void> {
    this.users.delete(userId.value);
  }

  // Other methods not implemented for this test
  async findUsersForAdmin(): Promise<any> { throw new Error('Not implemented'); }
  async countUsersByStatus(): Promise<any> { throw new Error('Not implemented'); }
  async cleanupDeletedUsers(): Promise<number> { throw new Error('Not implemented'); }
  async findInactiveUsers(): Promise<any> { throw new Error('Not implemented'); }
  async updateLastLogin(): Promise<void> { throw new Error('Not implemented'); }
  async markEmailVerified(): Promise<void> { throw new Error('Not implemented'); }
}

describe('User Management Domain Integration', () => {
  let mockRepository: MockUserRepository;
  let registerUserUseCase: RegisterUserUseCase;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    registerUserUseCase = new RegisterUserUseCase(mockRepository);
  });

  describe('User Entity', () => {
    it('should create encrypted user with privacy guarantees', async () => {
      // Arrange
      const email = 'test@uploadhaven.dev';
      const name = 'Test User';

      // Act
      const user = await User.createEncrypted(email, name);

      // Assert
      expect(user.id).toBeDefined();
      expect(user.emailHash).toBeDefined();
      expect(user.emailHash).toHaveLength(64); // SHA-256 hash
      expect(user.encryptedEmail).toBeDefined();
      expect(user.encryptedName).toBeDefined();
      expect(user.accountStatus.isPendingVerification()).toBe(true);
      expect(user.isActive).toBe(false); // Pending verification
    });

    it('should not expose sensitive data in plain text', async () => {
      // Arrange
      const email = 'sensitive@uploadhaven.dev';
      const name = 'Sensitive User';

      // Act
      const user = await User.createEncrypted(email, name);
      const userData = user.toData();

      // Assert
      expect(userData.emailHash).not.toContain('@');
      expect(userData.emailHash).not.toContain('sensitive');
      expect(userData.encryptedEmail.content).not.toContain('@');
      expect(userData.encryptedEmail.content).not.toContain('sensitive');
      expect(userData.encryptedName?.content).not.toContain('Sensitive');
      expect(userData.encryptedName?.content).not.toContain('User');
    });

    it('should handle user lifecycle operations', async () => {
      // Arrange
      const email = 'lifecycle@uploadhaven.dev';
      const user = await User.createEncrypted(email);

      // Act & Assert - Verify email
      expect(user.isEmailVerified).toBe(false);
      user.verifyEmail();
      expect(user.isEmailVerified).toBe(true);
      expect(user.isActive).toBe(true);

      // Record login
      const originalLastLogin = user.lastLoginAt;
      user.recordLogin();
      expect(user.lastLoginAt).not.toBe(originalLastLogin);

      // Suspend account
      user.suspend('Test suspension');
      expect(user.accountStatus.isSuspended()).toBe(true);
      expect(user.canAccess()).toBe(false);

      // Reactivate
      user.reactivate();
      expect(user.accountStatus.isActive()).toBe(true);
      expect(user.canAccess()).toBe(true);

      // Soft delete
      user.softDelete();
      expect(user.isDeleted).toBe(true);
      expect(user.accountStatus.isDeleted()).toBe(true);
    });
  });

  describe('Value Objects', () => {
    it('should create valid UserId', () => {
      // Act
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();

      // Assert
      expect(userId1.value).toBeDefined();
      expect(userId2.value).toBeDefined();
      expect(userId1.value).not.toBe(userId2.value);
      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should create EmailHash for privacy-preserving lookups', async () => {
      // Arrange
      const email = 'hash@uploadhaven.dev';

      // Act
      const emailHash1 = await EmailHash.fromEmail(email);
      const emailHash2 = await EmailHash.fromEmail(email);

      // Assert
      expect(emailHash1.value).toBeDefined();
      expect(emailHash1.value).toHaveLength(64);
      expect(emailHash1.equals(emailHash2)).toBe(true);
      expect(await emailHash1.matchesEmail(email)).toBe(true);
      expect(await emailHash1.matchesEmail('different@email.com')).toBe(false);
    });

    it('should encrypt and decrypt fields securely', async () => {
      // Arrange
      const plaintext = 'Sensitive Information';
      const encryptionKey = 'a'.repeat(64); // 64-char hex key

      // Act
      const encryptedField = await EncryptedField.encrypt(plaintext, encryptionKey);
      const decrypted = await encryptedField.decrypt(encryptionKey);

      // Assert
      expect(encryptedField.content).not.toBe(plaintext);
      expect(encryptedField.content).not.toContain('Sensitive');
      expect(decrypted).toBe(plaintext);
      expect(await encryptedField.canDecryptWith(encryptionKey)).toBe(true);
      expect(await encryptedField.canDecryptWith('wrong_key')).toBe(false);
    });

    it('should handle user preferences correctly', () => {
      // Act
      const defaultPrefs = UserPreferences.defaults();
      const customPrefs = defaultPrefs
        .setLanguage('fr')
        .setTheme('dark')
        .enableEnhancedPrivacy();

      // Assert
      expect(defaultPrefs.language).toBe('en');
      expect(defaultPrefs.privacyMode).toBe('standard');
      expect(defaultPrefs.analyticsOptIn).toBe(false);

      expect(customPrefs.language).toBe('fr');
      expect(customPrefs.theme).toBe('dark');
      expect(customPrefs.isEnhancedPrivacyMode()).toBe(true);
      expect(customPrefs.allowsAnalytics()).toBe(false);
    });
  });

  describe('Register User Use Case', () => {
    it('should register new user successfully', async () => {
      // Arrange
      const request = {
        email: 'newuser@uploadhaven.dev',
        name: 'New User',
        language: 'en' as const,
        agreedToTerms: true,
        agreedToPrivacy: true
      };

      // Act
      const response = await registerUserUseCase.execute(request);

      // Assert
      expect(response.userId).toBeDefined();
      expect(response.emailHash).toBeDefined();
      expect(response.requiresEmailVerification).toBe(true);
      expect(response.message).toContain('verify your email');

      // Verify user was saved
      const savedUser = await mockRepository.findByEmail(request.email);
      expect(savedUser).toBeDefined();
      expect(savedUser!.id).toBe(response.userId);
    });

    it('should reject duplicate email registration', async () => {
      // Arrange
      const email = 'duplicate@uploadhaven.dev';
      const user = await User.createEncrypted(email);
      await mockRepository.save(user);

      const request = {
        email,
        agreedToTerms: true,
        agreedToPrivacy: true
      };

      // Act & Assert
      await expect(registerUserUseCase.execute(request))
        .rejects.toThrow('User with this email already exists');
    });

    it('should validate registration requirements', async () => {
      // Invalid email
      await expect(registerUserUseCase.execute({
        email: 'invalid-email',
        agreedToTerms: true,
        agreedToPrivacy: true
      })).rejects.toThrow('Invalid email format');

      // Missing terms agreement
      await expect(registerUserUseCase.execute({
        email: 'valid@email.com',
        agreedToTerms: false,
        agreedToPrivacy: true
      })).rejects.toThrow('agree to the terms');

      // Missing privacy agreement
      await expect(registerUserUseCase.execute({
        email: 'valid@email.com',
        agreedToTerms: true,
        agreedToPrivacy: false
      })).rejects.toThrow('agree to the privacy policy');
    });
  });

  describe('Privacy Guarantees', () => {
    it('should never store plaintext email', async () => {
      // Arrange
      const email = 'private@uploadhaven.dev';
      const user = await User.createEncrypted(email);
      const userData = user.toData();

      // Assert
      expect(JSON.stringify(userData)).not.toContain('@uploadhaven.dev');
      expect(JSON.stringify(userData)).not.toContain('private');
    });

    it('should require encryption key for data access', async () => {
      // Arrange
      const email = 'encrypted@uploadhaven.dev';
      const name = 'Encrypted User';
      const key = 'a'.repeat(64);
      const user = await User.createEncrypted(email, name, key);

      // Act & Assert
      const decryptedEmail = await user.decryptEmail(key);
      const decryptedName = await user.decryptName(key);

      expect(decryptedEmail).toBe(email);
      expect(decryptedName).toBe(name);

      // Wrong key should fail
      await expect(user.decryptEmail('wrong_key'))
        .rejects.toThrow('Failed to decrypt');
    });
  });
});
