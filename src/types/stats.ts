/**
 * Statistics and Analytics Types for UploadHaven
 * Handles stats, analytics, and metrics
 */

// =============================================================================
// Base Statistics
// =============================================================================

/**
 * Base statistics structure
 */
export interface BaseStats {
  totalFiles: number;
  totalSize: number;
  totalSizeBytes?: number;
}

/**
 * User statistics
 */
export interface UserStats extends BaseStats {
  recentUploads: number;
  expiringSoon: number;
  last7dUploads?: number;
  last24hUploads?: number;
  totalDownloads?: number;
}

/**
 * Security statistics
 */
export interface SecurityStats {
  totalEvents: number;
  rateLimitHits: number;
  invalidFiles: number;
  blockedIPs: number;
  last24h: number;
  largeSizeBlocked?: number;
}
