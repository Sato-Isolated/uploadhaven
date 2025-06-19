// Dashboard hooks exports - Centralized exports following SRP principles

export { useDashboardData } from './useDashboardData';
export { useDashboardActions } from './useDashboardActions';

// Re-export types for convenience
export type {
  UseDashboardDataProps,
  UseDashboardDataReturn,
} from './useDashboardData';

export type {
  UseDashboardActionsProps, 
  UseDashboardActionsReturn,
} from './useDashboardActions';
