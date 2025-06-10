import { useMemo } from "react";
import { useUserStats } from "@/hooks/useUserStats";
import type { UserStats } from "@/types";

export interface UseClientUserStatsReturn {
  isAuthenticated: boolean;
  stats: UserStats | undefined;
  loading: boolean;
  error: Error | null;
  fetchStats: () => void;
}

export function useClientUserStats(userId: string, session?: { user?: unknown }): UseClientUserStatsReturn {
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
