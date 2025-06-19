// Dashboard Components - Exports centralisés suivant l'architecture SRP

// Layout Components
export { DashboardContainer } from './components/layout/DashboardContainer';
export { DashboardHeader } from './components/layout/DashboardHeader';

// Action Components  
// QuickAction components removed

// Stats Components
export { UserStatsGrid } from './components/stats/UserStatsGrid';
export { UserStatCard } from './components/stats/UserStatCard';
export { StatsLoadingState } from './components/stats/StatsLoadingState';
export { StatsErrorState } from './components/stats/StatsErrorState';

// Activity Components (NEW)
export { ActivityFeed } from './components/activity/ActivityFeed';
export { ActivityItem } from './components/activity/ActivityItem';
export { ActivityFilter } from './components/activity/ActivityFilter';

// Common Components (NEW)
export { EmptyState } from './components/common/EmptyState';
export { LoadingSpinner } from './components/common/LoadingSpinner';
export { ErrorBoundary } from './components/common/ErrorBoundary';

// Files Components (NEW - moved from files domain)
export * from './components/files';

// Upload Components (existing)
export { DashboardUploadArea } from './upload/DashboardUploadArea';

// Hooks (centralized)
export { useDashboardData } from './hooks/useDashboardData';
export { useDashboardActions } from './hooks/useDashboardActions';

// Main Component
export { DashboardClient } from './DashboardClient';
export { DashboardClient as default } from './DashboardClient';

// Types
export type * from './types';
