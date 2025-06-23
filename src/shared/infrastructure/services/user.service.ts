/**
 * User Service - User Management Domain Bridge
 * 
 * Provides user registration/authentication operations bridging to the user-management domain.
 * Focuses only on user operations following SRP.
 * 
 * @domain user-management
 * @pattern Service Layer (DDD)
 */

import { DomainContainer } from '../di/domain-container';

export class UserService {

  /**
   * User registration - bridges to domain
   */
  static async registerUser(params: {
    email: string;
    password: string;
    name?: string;
    clientIP: string;
    userAgent: string;
  }): Promise<{
    user?: {
      id: string;
      email: string;
      name?: string;
    };
    session?: any;
    error?: string;
  }> {
    const container = DomainContainer.getInstance();
    const registerUserUseCase = container.getRegisterUserUseCase();

    try {
      const result = await registerUserUseCase.execute({
        email: params.email,
        encryptionKey: params.password, // Map password to encryptionKey
        name: params.name,
        agreedToTerms: true, // Default for service layer
        agreedToPrivacy: true // Default for service layer
      });
      return {
        user: {
          id: result.userId,
          email: params.email, // Use the email from params since it's not in response
          name: params.name
        },
        session: undefined // Session not provided by use case
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * User authentication - bridges to domain
   */
  static async authenticateUser(email: string, password: string) {
    // Enhanced placeholder with validation structure
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // TODO: Implement actual authentication with BetterAuth integration
    return {
      success: false,
      error: 'Authentication use case implementation pending - domain migration in progress',
      featureStatus: 'pending',
      estimatedCompletion: 'Next sprint',
      workaround: 'Use existing auth API endpoints directly for now'
    };
  }

  /**
   * Log authentication event
   */
  static async logAuthenticationEvent(params: {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    clientIP: string;
    userAgent: string;
    userId?: string;
  }): Promise<void> {
    const container = DomainContainer.getInstance();
    const logSecurityEventUseCase = container.getLogSecurityEventUseCase(); await logSecurityEventUseCase.execute({
      eventType: params.type,
      severity: params.severity,
      context: {
        source: 'auth',
        action: 'block_user',
        clientIP: params.clientIP
      },
      metadata: {
        requestDuration: Date.now() - Date.now(), // Placeholder
        errorCode: params.type,
      }
    });
  }
}
