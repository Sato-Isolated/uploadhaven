import bcrypt from 'bcrypt';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12; // Good balance between security and performance

  /**
   * Hash a password
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Verify that a password meets security criteria
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    // Optional: add other security criteria
    // if (!/[A-Z]/.test(password)) {
    //   errors.push('Password must contain at least one uppercase letter');
    // }

    // if (!/[a-z]/.test(password)) {
    //   errors.push('Password must contain at least one lowercase letter');
    // }

    // if (!/\d/.test(password)) {
    //   errors.push('Password must contain at least one number');
    // }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
