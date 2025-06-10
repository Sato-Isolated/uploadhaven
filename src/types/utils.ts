/**
 * Utility Types for UploadHaven
 * Handles utility types, callbacks, and common enums
 */

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Generic callback function
 */
export type CallbackFunction<T = void> = (data?: T) => void;

/**
 * Async callback function
 */
export type AsyncCallbackFunction<T = void> = (data?: T) => Promise<void>;

/**
 * Time range options for analytics
 */
export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d';

/**
 * Export data types
 */
export type ExportDataType = 'users' | 'files' | 'activities' | 'security';
