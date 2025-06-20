/**
 * Audit Logs React Hooks
 * Custom hooks for managing audit logs in the admin dashboard
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/core/queryKeys';
import { toast } from 'sonner';
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogQueryResponse,
  AuditStats,
  AuditExportOptions,
  AuditExportResult
} from '@/types/audit';

// =============================================================================
// Query Keys
// =============================================================================

const auditQueryKeys = {
  all: ['audit'] as const,
  logs: (filters?: AuditLogFilters) => [...auditQueryKeys.all, 'logs', filters] as const,
  stats: (timeRange?: string) => [...auditQueryKeys.all, 'stats', timeRange] as const,
};

// =============================================================================
// Audit Logs Query Hook
// =============================================================================

interface UseAuditLogsOptions {
  filters?: AuditLogFilters;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { filters = {}, enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: auditQueryKeys.logs(filters),
    queryFn: async (): Promise<AuditLogQueryResponse> => {
      const searchParams = new URLSearchParams();
      
      // Add filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            searchParams.append(`${key}s`, value.join(','));
          } else if (value instanceof Date) {
            searchParams.append(key, value.toISOString());
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const response = await ApiClient.get<{ data: AuditLogQueryResponse }>(
        `/api/admin/audit/logs?${searchParams.toString()}`
      );
      
      return response.data;
    },
    enabled,
    refetchInterval,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// =============================================================================
// Audit Statistics Query Hook
// =============================================================================

interface UseAuditStatsOptions {
  timeRange?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useAuditStats(options: UseAuditStatsOptions = {}) {
  const { timeRange = '24h', enabled = true, refetchInterval = 5 * 60 * 1000 } = options;

  return useQuery({
    queryKey: auditQueryKeys.stats(timeRange),
    queryFn: async (): Promise<AuditStats> => {
      const response = await ApiClient.get<{ data: AuditStats }>(
        `/api/admin/audit/stats?timeRange=${timeRange}`
      );
      
      return response.data;
    },
    enabled,
    refetchInterval,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3,
  });
}

// =============================================================================
// Export Audit Logs Mutation Hook
// =============================================================================

export function useExportAuditLogs() {
  const queryClient = useQueryClient();

  return useMutation({    mutationFn: async (exportOptions: AuditExportOptions): Promise<AuditExportResult> => {
      const response = await ApiClient.post<{ data: AuditExportResult }>(
        '/api/admin/audit/export',
        exportOptions as unknown as Record<string, unknown>
      );
      
      return response.data;
    },
    onSuccess: (result) => {
      if (result.success && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Audit logs exported successfully (${result.recordCount} records)`);
      } else {
        toast.error(result.error || 'Export failed');
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export audit logs';
      toast.error(errorMessage);
    },
  });
}

// =============================================================================
// Real-time Audit Logs Hook
// =============================================================================

interface UseRealtimeAuditLogsOptions {
  enabled?: boolean;
  pollInterval?: number;
  onNewLogs?: (logs: AuditLog[]) => void;
}

export function useRealtimeAuditLogs(options: UseRealtimeAuditLogsOptions = {}) {
  const { 
    enabled = true, 
    pollInterval = 5000, // 5 seconds
    onNewLogs 
  } = options;

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: auditQueryKeys.logs({ limit: 10, sortBy: 'timestamp', sortOrder: 'desc' }),
    queryFn: async (): Promise<AuditLog[]> => {
      const response = await ApiClient.get<{ data: AuditLogQueryResponse }>(
        '/api/admin/audit/logs?limit=10&sortBy=timestamp&sortOrder=desc'
      );
      
      return response.data.logs;
    },
    enabled,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
  });

  // Handle new logs callback
  const { data: newLogs } = query;
  if (onNewLogs && newLogs && newLogs.length > 0) {
    onNewLogs(newLogs);
  }

  return query;
}

// =============================================================================
// Clear Old Audit Logs Mutation Hook
// =============================================================================

interface ClearOldLogsOptions {
  daysOld: number;
}

export function useClearOldAuditLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: ClearOldLogsOptions): Promise<{ deletedCount: number }> => {
      const response = await ApiClient.delete<{ data: { deletedCount: number } }>(
        `/api/admin/audit/logs?daysOld=${options.daysOld}`
      );
      
      return response.data;
    },
    onSuccess: (result) => {
      // Invalidate audit queries to refetch data
      queryClient.invalidateQueries({ queryKey: auditQueryKeys.all });
      toast.success(`Cleaned up ${result.deletedCount} old audit logs`);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup audit logs';
      toast.error(errorMessage);
    },
  });
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to get audit log counts by category
 */
export function useAuditLogCounts(filters?: Partial<AuditLogFilters>) {
  return useQuery({
    queryKey: [...auditQueryKeys.all, 'counts', filters],
    queryFn: async () => {
      const stats = await ApiClient.get<{ data: AuditStats }>('/api/admin/audit/stats');
      return stats.data.byCategory;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to invalidate all audit queries
 */
export function useInvalidateAuditQueries() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: auditQueryKeys.all });
  };
}

/**
 * Hook to prefetch audit logs with specific filters
 */
export function usePrefetchAuditLogs() {
  const queryClient = useQueryClient();
  
  return (filters: AuditLogFilters) => {
    queryClient.prefetchQuery({
      queryKey: auditQueryKeys.logs(filters),
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });

        const response = await ApiClient.get<{ data: AuditLogQueryResponse }>(
          `/api/admin/audit/logs?${searchParams.toString()}`
        );
        
        return response.data;
      },
      staleTime: 30 * 1000,
    });
  };
}
