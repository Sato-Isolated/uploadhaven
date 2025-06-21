/**
 * Notification Hooks - SRP-based Architecture
 * Each hook has a single, focused responsibility
 * 
 * Following the Single Responsibility Principle:
 * - useNotificationQuery: Data fetching only
 * - useNotificationMutations: CRUD operations only  
 * - useNotificationRealtime: Real-time connections only
 * - useNotificationStats: Statistics only
 * - useNotificationConnection: Connection state only
 * - useNotifications: Composition hook (orchestrates others)
 */

// Core notification hooks
export { useNotificationQuery } from './useNotificationQuery';
export { useNotificationMutations } from './useNotificationMutations';
export { useNotificationRealtime } from './useNotificationRealtime';
export { useNotificationStats } from './useNotificationStats';
export { useNotificationConnection } from './useNotificationConnection';

// Main composition hook
export { useNotifications } from './useNotifications';

// Specialized domain hooks
export { useSecurityNotifications } from './useSecurityNotifications';
export { useFileNotifications } from './useFileNotifications';
export { useSystemNotifications } from './useSystemNotifications';

// UI state hooks
export { useNotificationUI } from './useNotificationUI';
export { useNotificationFilters } from './useNotificationFilters';

// Types are available by importing from individual hook files
