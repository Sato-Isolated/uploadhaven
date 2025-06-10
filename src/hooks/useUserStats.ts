import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import type { UserStats } from '@/types';

/**
 * Hook pour récupérer les statistiques utilisateur avec auto-refresh
 * Compatible avec l'API /api/user/stats qui retourne { success: boolean, stats: UserStats }
 */
export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: queryKeys.userStats(userId),
    queryFn: async () => {
      const response = await ApiClient.get<{ success: boolean; stats: UserStats }>('/api/user/stats');
      return response.stats; // Return only the stats object
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh toutes les 5 minutes
    refetchOnWindowFocus: true, // Rafraîchir quand on revient sur l'onglet
  });
}
