/**
 * Centralized query keys for TanStack Query
 * Provides type-safe and consistent cache key management
 *
 * Key hierarchy:
 * - ['uploadhaven'] - root
 * - ['uploadhaven', 'files'] - all files queries
 * - ['uploadhaven', 'files', id] - specific file
 * - ['uploadhaven', 'users'] - all users queries
 * - ['uploadhaven', 'analytics', 'admin', timeRange] - admin analytics
 */

// Types for better type safety
export type TimeRange = '24h' | '7d' | '30d' | '90d';
export type ActivityFilters = {
  page?: number;
  limit?: number;
  type?: string;
  severity?: string;
  userId?: string;
};

export const queryKeys = {
  // Root key for all queries
  all: ['uploadhaven'] as const,
  // Files domain
  files: () => [...queryKeys.all, 'files'] as const,
  file: (id: string) => [...queryKeys.files(), id] as const,  filesList: (filters?: Record<string, unknown>) =>
    [...queryKeys.files(), 'list', filters] as const,
  fileMetadata: (shortUrl: string) =>
    [...queryKeys.files(), 'metadata', shortUrl] as const,

  // Users domain
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  userStats: (id?: string) => [...queryKeys.users(), 'stats', id] as const,
  userFiles: (userId: string, filters?: Record<string, unknown>) =>
    [...queryKeys.users(), userId, 'files', filters] as const,

  // Analytics domain
  analytics: () => [...queryKeys.all, 'analytics'] as const,
  analyticsSystem: (timeRange: TimeRange) =>
    [...queryKeys.analytics(), 'system', timeRange] as const,
  analyticsUsers: (timeRange: TimeRange) =>
    [...queryKeys.analytics(), 'users', timeRange] as const,
  analyticsFiles: (timeRange: TimeRange) =>
    [...queryKeys.analytics(), 'files', timeRange] as const,
  analyticsAdmin: (timeRange: TimeRange) =>
    [...queryKeys.analytics(), 'admin', timeRange] as const,
  analyticsUser: (userId: string, timeRange: TimeRange) =>
    [...queryKeys.analytics(), 'user', userId, timeRange] as const,

  // Activities domain
  activities: (filters?: ActivityFilters) =>
    [...queryKeys.all, 'activities', filters] as const,
  activitiesList: (filters?: ActivityFilters) =>
    [...queryKeys.activities(), 'list', filters] as const,
  // Security domain
  security: () => [...queryKeys.all, 'security'] as const,
  securityEvents: (timeRange?: TimeRange) =>
    [...queryKeys.security(), 'events', timeRange] as const,
  securityStats: () => [...queryKeys.security(), 'stats'] as const,  securityLogs: (filters?: Record<string, unknown>) =>
    [...queryKeys.security(), 'logs', filters] as const,
  securityFiles: () => [...queryKeys.security(), 'files'] as const,

  // Stats domain
  stats: () => [...queryKeys.all, 'stats'] as const,
  adminStats: () => [...queryKeys.stats(), 'admin'] as const,
  systemStats: () => [...queryKeys.stats(), 'system'] as const,

  // Downloads domain
  downloads: () => [...queryKeys.all, 'downloads'] as const,
  downloadStats: (timeRange?: TimeRange) =>
    [...queryKeys.downloads(), 'stats', timeRange] as const,
  downloadHistory: (userId?: string, timeRange?: TimeRange) =>
    [...queryKeys.downloads(), 'history', userId, timeRange] as const,

  // Real-time data domain
  realtime: () => [...queryKeys.all, 'realtime'] as const,
  realtimeStats: () => [...queryKeys.realtime(), 'stats'] as const,
  realtimeActivities: () => [...queryKeys.realtime(), 'activities'] as const,

  // Development tools domain (dev-only)
  dev: () => [...queryKeys.all, 'dev'] as const,
  translationCheck: () => [...queryKeys.dev(), 'translation-check'] as const,
} as const;
