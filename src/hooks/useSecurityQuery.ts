import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/core/queryKeys';
import { toast } from 'sonner';
import type {
  BaseAuditLog,
  AuditSeverity,
  AuditCategory,
  AuditStats,
} from '@/types/audit';

interface AuditApiResponse {
  activities: Array<{
    id: string;
    action: string;
    description: string;
    category: string;
    severity: string;
    status: string;
    timestamp: string | number;
    ipHash?: string;
    metadata?: Record<string, unknown>;
    userAgent?: string;
    userId?: string;
    adminId?: string;
  }>;
  stats?: AuditStats;
}

/**
 * Hook to fetch security data (audit logs and stats)
 */
export function useSecurityData() {
  return useQuery({
    queryKey: queryKeys.security(),    queryFn: async (): Promise<{
      events: BaseAuditLog[];
      stats: AuditStats;
    }> => {
      const response = await ApiClient.get<AuditApiResponse>(
        '/api/admin/activities?includeStats=true'
      );

      // Transform API activities to BaseAuditLog format
      const events: BaseAuditLog[] = response.activities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        description: activity.description,
        category: activity.category as AuditCategory,
        severity: activity.severity as AuditSeverity,
        status: activity.status as any,
        timestamp: new Date(
          typeof activity.timestamp === 'string'
            ? parseInt(activity.timestamp)
            : activity.timestamp || 0
        ),
        ipHash: activity.ipHash || '',
        userAgent: activity.userAgent,
        userId: activity.userId,
        adminId: activity.adminId,
        metadata: activity.metadata || {},
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      }));

      return {
        events,
        stats: response.stats || {
          totalLogs: 0,
          last24Hours: 0,
          last7Days: 0,
          last30Days: 0,
          bySeverity: {
            info: 0,
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
          },
          byCategory: {
            user_action: 0,
            admin_action: 0,
            security_event: 0,
            system_event: 0,
            data_access: 0,
            file_operation: 0,
            auth_event: 0,
            compliance: 0,
          },
          topActions: [],
          securityEvents: {
            total: 0,
            blocked: 0,
            critical: 0,
            last24h: 0,
          },
          systemHealth: {
            errorRate: 0,
            avgResponseTime: 0,
            uptimePercentage: 100,
          },
        },
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to export security logs
 */
export function useExportSecurityLogs() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch('/api/security/export');
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success('Security logs exported successfully');
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to export security logs';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to clear security logs
 */
export function useClearSecurityLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch('/api/security/clear', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Clear failed: ${response.status}`);
      }
    },
    onSuccess: () => {
      // Invalidate security queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.security() });
      toast.success('Security logs cleared successfully');
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to clear security logs';
      toast.error(errorMessage);
    },
  });
}
