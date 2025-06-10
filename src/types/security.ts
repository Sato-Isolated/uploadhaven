/**
 * Security and Scanning Types for UploadHaven
 * Handles security scanning, rate limiting, and threat detection
 */

// =============================================================================
// Security and Scanning Types
// =============================================================================

/**
 * Scan types available in the system
 */
export type ScanType = "quick" | "full" | "custom";

/**
 * Malware scanning results
 */
export interface ScanResult {
  type: string;
  status: "clean" | "threat" | "warning";
  message: string;
  details?: string;
  timestamp: Date;
}

/**
 * More detailed malware scan result
 */
export interface MalwareScanResult {
  isClean: boolean;
  isSuspicious: boolean;
  isMalicious: boolean;
  threatName?: string;
  engineResults?: Array<{
    engine: string;
    result: string;
    category: string;
  }>;
  source: "local" | "virustotal" | "cache";
  scannedAt: Date;
}

/**
 * VirusTotal API response structure
 */
export interface VirusTotalResponse {
  data: {
    attributes: {
      stats: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
      };
      last_analysis_results: Record<
        string,
        {
          category: string;
          engine_name: string;
          result: string | null;
        }
      >;
    };
  };
}

/**
 * API quota status for external services like VirusTotal
 */
export interface QuotaStatus {
  used: number;
  remaining: number;
  total: number;
  resetsAt: string;
}

/**
 * Individual scanned file status
 */
export interface ScannedFile {
  fileName: string;
  status: "scanning" | "clean" | "suspicious" | "threat" | "error";
  details?: string;
  scanResult?: MalwareScanResult;
}

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
