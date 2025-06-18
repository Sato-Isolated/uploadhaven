/**
 * Security and Rate Limiting Types for UploadHaven
 * Handles rate limiting and general security features
 */

// =============================================================================
// Rate Limiting
// =============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

/**
 * Rate limit tracking data
 */
export interface RateLimitData {
  requests: number;
  windowStart: number;
}

// =============================================================================
// System Operations
// =============================================================================

/**
 * Background cleanup operation statistics
 */
export interface CleanupStats {
  deletedCount: number;
  totalExpired: number;
  errors: string[];
}

/**
 * Daily quota tracking for external services
 */
export interface DailyQuota {
  date: string;
  used: number;
  limit: number;
}
