/**
 * Legacy performance monitoring - redirects to new unified system
 * @deprecated Use @/lib/performance instead
 */

// Re-export from the new unified performance monitoring system
export { performanceMonitor } from './performance/index';

// Legacy exports for backwards compatibility
export type { UnifiedPerformanceSummary as PerformanceSummary } from './performance/index';
