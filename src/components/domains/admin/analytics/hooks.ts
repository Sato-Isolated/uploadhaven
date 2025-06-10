import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { AdminAnalytics } from './utils';

type TimeRange = '24h' | '7d' | '30d' | '90d';

/**
 * Hook pour récupérer les analytics administrateur avec TanStack Query
 * Remplace l'ancien appel useApi avec une gestion plus intelligente du cache
 */
export function useAdminAnalytics(timeRange: string) {
  return useQuery({
    queryKey: queryKeys.analyticsAdmin(timeRange as TimeRange),
    queryFn: () => ApiClient.get<AdminAnalytics>(`/api/analytics/admin?timeRange=${timeRange}`),
    staleTime: 2 * 60 * 1000, // 2 minutes - données assez fraîches pour analytics
    refetchInterval: 5 * 60 * 1000, // Auto-refresh toutes les 5 minutes
    refetchOnWindowFocus: true, // Rafraîchir quand on revient sur l'onglet
  });
}
