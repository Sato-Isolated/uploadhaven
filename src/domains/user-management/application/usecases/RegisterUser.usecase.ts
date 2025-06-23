/**
 * 🔐 Register User Use Case - Privacy-First Account Creation
 * 
 * Handles user registration with encrypted personal data storage.
 * Zero-knowledge: User data encrypted before storage, server cannot decrypt.
 * 
 * @domain user-management
 * @pattern Use Case (DDD)
 * @privacy zero-knowledge - encrypted registration
 */

import { User } from '../../domain/entities/User.entity';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { EmailHash } from '../../domain/value-objects/EmailHash.vo';

export interface RegisterUserRequest {
  readonly email: string;
  readonly name?: string;
  readonly encryptionKey?: string;    // Optional client-provided key
  readonly language?: 'en' | 'fr' | 'es';
  readonly agreedToTerms: boolean;
  readonly agreedToPrivacy: boolean;
}

export interface RegisterUserResponse {
  readonly userId: string;
  readonly emailHash: string;
  readonly requiresEmailVerification: boolean;
  readonly message: string;
}

/**
 * Use case for registering new users
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) { }

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Validate input
    await this.validateRegistrationRequest(request);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user with encrypted data
    const user = await User.createEncrypted(
      request.email,
      request.name,
      request.encryptionKey
    );

    // Set language preference if provided
    if (request.language) {
      user.updatePreferences({ language: request.language });
    }

    // Save user to repository
    await this.userRepository.save(user);

    return {
      userId: user.id,
      emailHash: user.emailHash,
      requiresEmailVerification: true,
      message: 'Account created successfully. Please verify your email to activate your account.'
    };
  }

  /**
   * Validate registration request
   */
  private async validateRegistrationRequest(request: RegisterUserRequest): Promise<void> {
    // Email validation
    if (!request.email || typeof request.email !== 'string') {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('Invalid email format');
    }

    // Name validation (if provided)
    if (request.name !== undefined) {
      if (typeof request.name !== 'string') {
        throw new Error('Name must be a string');
      }
      if (request.name.length > 100) {
        throw new Error('Name cannot exceed 100 characters');
      }
    }

    // Terms and privacy agreement validation
    if (!request.agreedToTerms) {
      throw new Error('You must agree to the terms of service');
    }

    if (!request.agreedToPrivacy) {
      throw new Error('You must agree to the privacy policy');
    }

    // Encryption key validation (if provided)
    if (request.encryptionKey !== undefined) {
      if (typeof request.encryptionKey !== 'string') {
        throw new Error('Encryption key must be a string');
      }
      if (request.encryptionKey.length < 32) {
        throw new Error('Encryption key must be at least 32 characters');
      }
    }

    // Language validation (if provided)
    if (request.language !== undefined) {
      const validLanguages = ['en', 'fr', 'es'];
      if (!validLanguages.includes(request.language)) {
        throw new Error('Invalid language selection');
      }
    }
  }
}
