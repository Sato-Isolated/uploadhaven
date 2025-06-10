/**
 * Hook Configuration and State Types for UploadHaven
 * Handles hook configurations, polling, and state management
 */

// =============================================================================
// Polling and Real-time
// =============================================================================

/**
 * Polling options for hooks
 */
export interface PollingOptions {
  interval?: number; // in milliseconds
  immediate?: boolean;
  enabled?: boolean;
}
