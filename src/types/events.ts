/**
 * Events and Activities Types for UploadHaven
 * Handles system events, activities, and security events
 */

import type { PaginationData } from './api';

// =============================================================================
// Base Event Types
// =============================================================================

/**
 * Base event structure
 */
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string | Date;
  details?: string;
  severity?: SecuritySeverity;
  ip?: string;
  userAgent?: string;
}

/**
 * Activity event with file metadata
 */
export interface ActivityEvent extends BaseEvent {
  _id?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
}

/**
 * Activity response with pagination
 */
export interface ActivityResponse {
  activities: ActivityEvent[];
  pagination: PaginationData;
}

// =============================================================================
// Security Events
// =============================================================================

/**
 * Security severity levels
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Security event types
 */
export type SecurityEventType = 
  | 'malware_detected'
  | 'invalid_file'
  | 'rate_limit_exceeded'
  | 'rate_limit'
  | 'suspicious_activity'
  | 'unauthorized_access'
  | 'blocked_ip'
  | 'large_file'
  | 'access_denied'
  | 'system_maintenance'
  | 'user_login'
  | 'user_logout'
  | 'user_registration'
  | 'file_scan'
  | 'file_upload'
  | 'file_download';

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: string | Date;
  ip?: string;
  userAgent?: string;
  severity?: SecuritySeverity;
  metadata?: Record<string, unknown>;
  details?: {
    ip?: string;
    filename?: string;
    fileSize?: number;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
    userId?: string;
  } | string;
  message?: string; // Optional message field for compatibility
}
