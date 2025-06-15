// hooks/useTranslationReload.ts - Hook pour recharger les traductions automatiquement

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook personnalisé pour recharger les traductions lors des changements
 * En développement, ce hook peut être utilisé pour forcer le rechargement
 * des traductions sans redémarrer le serveur
 */
export function useTranslationReload() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Écouter les événements de hot reload personnalisés
      const handleTranslationUpdate = () => {
        console.log('🔄 Rechargement des traductions...');
        // Forcer le rechargement de la page en développement
        router.refresh();
      };

      // Écouter les changements via WebSocket (si configuré)
      if (typeof window !== 'undefined' && 'WebSocket' in window) {
        const ws = new WebSocket('ws://localhost:3001/translation-reload');

        ws.onmessage = (event) => {
          if (event.data === 'translation-updated') {
            handleTranslationUpdate();
          }
        };

        ws.onerror = () => {
          // Fallback silencieux si le WebSocket n'est pas disponible
        };

        return () => {
          ws.close();
        };
      }
    }
  }, [router]);
}

/**
 * Version alternative qui utilise TanStack Query pour le polling
 * Now uses proper query patterns instead of direct fetch
 */
export function useTranslationPolling(intervalMs: number = 2000) {
  const router = useRouter();

  // TanStack Query for translation checking (dev-only)
  const { data: translationData, isError } = useQuery({
    queryKey: queryKeys.translationCheck(),
    queryFn: async () => {
      return ApiClient.get<{ lastModified: number }>('/api/translation-check');
    },
    enabled: process.env.NODE_ENV === 'development',
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
    retry: 1, // Minimal retries for dev tool
    retryDelay: 500,
    staleTime: 0, // Always fetch fresh data for dev tool
    meta: {
      // Mark as dev-only query
      isDevelopmentOnly: true,
    },
  });

  // Handle translation updates
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && translationData) {
      // Store the previous lastModified value
      const storedLastModified = sessionStorage.getItem('translation-last-modified');
      const previousLastModified = storedLastModified ? parseInt(storedLastModified, 10) : null;

      if (previousLastModified && translationData.lastModified > previousLastModified) {
        console.log('📝 Traductions mises à jour, rechargement...');
        router.refresh();
      }

      // Update stored value
      sessionStorage.setItem('translation-last-modified', translationData.lastModified.toString());
    }
  }, [translationData, router]);

  // Handle errors silently (dev tool shouldn't be disruptive)
  useEffect(() => {
    if (isError && process.env.NODE_ENV === 'development') {
      console.debug('Translation polling unavailable (this is normal if API endpoint does not exist)');
    }
  }, [isError]);
}
