'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminStats, AdminUser, AdminFile, AdminActivity, SystemHealth } from '@/types/admin';

interface AdminData {
  stats: AdminStats | null;
  users: AdminUser[];
  files: AdminFile[];
  activities: AdminActivity[];
  systemHealth: SystemHealth | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
}

export function useAdminData(): AdminData {
  const [error, setError] = useState<string | null>(null);
  // Query pour les statistiques principales
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      const result = await response.json();
      return result.data as AdminStats;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    retry: 3
  });
  // Query pour les utilisateurs
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    refetch: refetchUsers,
    error: usersError
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log('🔄 Fetching users...');
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error fetching users:', response.status, errorText);
        throw new Error(`Erreur lors du chargement des utilisateurs: ${response.status}`);
      }      const data = await response.json();
      console.log('🔍 Raw API response:', data);
      console.log('🔍 API response keys:', Object.keys(data));
      console.log('🔍 API response.data.users:', data.data?.users);
      console.log('✅ Users fetched successfully:', data.data?.users?.length || 0, 'users');
      return data.data?.users || [];
    },
    refetchInterval: 60000, // Rafraîchir toutes les minutes
    retry: 3
  });

  // Query pour les fichiers (limité aux plus récents)
  const { 
    data: filesData, 
    isLoading: filesLoading, 
    refetch: refetchFiles 
  } = useQuery({
    queryKey: ['admin-files'],    queryFn: async () => {
      const response = await fetch('/api/files?limit=100&sort=uploadDate&order=desc');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des fichiers');
      }
      const data = await response.json();
      return data.data?.files || []; // Correct path for the API response
    },
    refetchInterval: 60000,
    retry: 3
  });

  // Query pour les activités récentes
  const { 
    data: activitiesData, 
    isLoading: activitiesLoading, 
    refetch: refetchActivities 
  } = useQuery({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activities?limit=10');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des activités');
      }
      const data = await response.json();
        // Transformer les données d'activité
      return (data.activities || []).map((activity: unknown) => {
        const act = activity as Record<string, unknown>;
        return {
          id: (act.id || act._id) as string,
          type: (act.type || 'unknown') as string,
          description: (act.details || act.message || 'Unknown activity') as string,
          timestamp: (act.timestamp || act.createdAt) as string,
          userName: (act.userEmail || act.user) as string | undefined,
          userId: act.userId as string | undefined,
          severity: (act.severity || 'info') as 'info' | 'warning' | 'error',
          metadata: act.metadata as Record<string, unknown> | undefined
        };
      });},
    refetchInterval: 30000,
    retry: 3
  });

  // Query pour la santé du système
  const { 
    data: systemHealthData, 
    isLoading: systemHealthLoading, 
    refetch: refetchSystemHealth 
  } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-health');
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }
      const result = await response.json();
      return result.data as SystemHealth;
    },
    refetchInterval: 15000, // Refresh every 15 seconds for real-time monitoring
    retry: 3  });
  const isLoading = statsLoading || usersLoading || filesLoading || activitiesLoading || systemHealthLoading;

  // Gestion globale des erreurs
  useEffect(() => {
    const hasError = [statsData, usersData, filesData, activitiesData].some(      data => data === undefined && !isLoading
    );
    
    if (hasError) {
      setError('Some data could not be loaded');
    } else {
      setError(null);
    }
  }, [statsData, usersData, filesData, activitiesData, systemHealthData, isLoading]);

  const refreshData = useCallback(() => {
    refetchStats();
    refetchUsers();
    refetchFiles();
    refetchActivities();
    refetchSystemHealth();
  }, [refetchStats, refetchUsers, refetchFiles, refetchActivities, refetchSystemHealth]);

  return {
    stats: statsData || null,
    users: usersData || [],
    files: filesData || [],
    activities: activitiesData || [],
    systemHealth: systemHealthData || null,
    isLoading,
    error,
    refreshData
  };
}
