// hooks/useTranslationReload.ts - Hook pour recharger les traductions automatiquement

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
 * Version alternative qui utilise un polling simple
 */
export function useTranslationPolling(intervalMs: number = 2000) {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      let lastModified: number | null = null;

      const checkForUpdates = async () => {
        try {
          // Vérifier la dernière modification des fichiers de traduction
          const response = await fetch('/api/translation-check');
          if (response.ok) {
            const data = await response.json();
            if (lastModified && data.lastModified > lastModified) {
              console.log('📝 Traductions mises à jour, rechargement...');
              router.refresh();
            }
            lastModified = data.lastModified;
          }
        } catch {
          // Ignorer les erreurs silencieusement
        }
      };

      const interval = setInterval(checkForUpdates, intervalMs);
      checkForUpdates(); // Vérification initiale

      return () => clearInterval(interval);
    }
  }, [router, intervalMs]);
}
