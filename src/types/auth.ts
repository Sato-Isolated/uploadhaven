/**
 * Authentication and User Types for UploadHaven
 * Handles user interfaces and authentication-related types
 */

// =============================================================================
// User Types
// =============================================================================

/**
 * Base user interface
 */
export interface BaseUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

/**
 * Extended user with additional information
 */
export interface ExtendedUser extends BaseUser {
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  lastActiveAt?: string;
}

/**
 * User interface for admin operations
 */
export interface User {
  _id: string;
  name?: string;
  email: string;
  role?: string;
  createdAt: string;
  emailVerified?: boolean;
  isActive?: boolean;
}
