import { useMemo } from "react";
import { useUserStats } from "@/hooks/useUserStats";

export interface UseClientUserStatsReturn {
  isAuthenticated: boolean;
  stats: any;
  loading: boolean;
  error: any;
  fetchStats: () => void;
}

export function useClientUserStats(userId: string, session?: any): UseClientUserStatsReturn {
  // Stabilize the authentication check to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => Boolean(session?.user), [session?.user]);

  // Use TanStack Query for better performance and caching
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch: fetchStats,
  } = useUserStats(isAuthenticated ? userId : undefined);

  return {
    isAuthenticated,
    stats,
    loading,
    error,
    fetchStats,
  };
}
