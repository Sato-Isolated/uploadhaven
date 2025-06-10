/**
 * API and Response Types for UploadHaven
 * Handles API responses, pagination, and data filtering
 */

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination data structure
 */
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalCount: number; // For backward compatibility
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Pagination state management
 */
export interface PaginationState {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Pagination hook options
 */
export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

// =============================================================================
// Filtering and Search
// =============================================================================

/**
 * Base filters interface
 */
export interface BaseFilters {
  search?: string;
  type?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

// =============================================================================
// API State Management
// =============================================================================

/**
 * API state management
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * API hook options
 */
export interface ApiOptions {
  immediate?: boolean;
  method?: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}
