import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import type { SecurityEvent, SecurityStats, SecurityEventType, SecuritySeverity } from '@/components/types/common';

interface SecurityApiResponse {
  events: Array<{
    id: string;
    type: string;
    message?: string;
    details?: string | any;
    severity: string;
    timestamp: string | number;
    ip?: string;
    filename?: string;
    fileSize?: number;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
  }>;
  stats: SecurityStats;
}

/**
 * Hook to fetch security data (events and stats)
 */
export function useSecurityData() {
  return useQuery({
    queryKey: queryKeys.security(),
    queryFn: async (): Promise<{ events: SecurityEvent[]; stats: SecurityStats }> => {
      const response = await ApiClient.get<SecurityApiResponse>('/api/security?include_events=true');      // Transform API events to SecurityEvent format
      const events: SecurityEvent[] = response.events.map((event) => ({
        id: event.id,
        type: event.type as SecurityEventType,
        severity: event.severity as SecuritySeverity,
        timestamp: typeof event.timestamp === "string"
          ? new Date(parseInt(event.timestamp))
          : new Date(event.timestamp || 0),
        details: {
          ip: event.ip,
          filename: event.filename,
          fileSize: event.fileSize,
          userAgent: event.userAgent,
          endpoint: event.endpoint,
          reason: event.reason,
        },
        message: typeof event.details === "string" 
          ? event.details 
          : event.message || `${event.type} event`,
      }));

      return {
        events,
        stats: response.stats || {
          totalEvents: 0,
          rateLimitHits: 0,
          invalidFiles: 0,
          blockedIPs: 0,
          last24h: 0,
          malwareDetected: 0,
          largeSizeBlocked: 0,
        }
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to export security logs';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear security logs';
      toast.error(errorMessage);
    },
  });
}

interface SecurityScanStatus {
  virusTotalConfigured: boolean;
  quotaStatus?: {
    used: number;
    remaining: number;
    total: number;
    resetsAt: string;
  };
}

/**
 * Hook to fetch security scan status
 */
export function useSecurityScan(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.securityScan(),
    queryFn: async (): Promise<SecurityScanStatus> => {
      const response = await ApiClient.get<SecurityScanStatus>('/api/security/scan');
      return response;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
}
