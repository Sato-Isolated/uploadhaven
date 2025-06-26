"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Temps avant qu'une requête soit considérée comme "stale"
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Temps de cache avant garbage collection
            gcTime: 10 * 60 * 1000, // 10 minutes
            // Retry automatique en cas d'échec
            retry: (failureCount, error: unknown) => {
              // Ne pas retry pour les erreurs 4xx (client errors)
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              // Retry jusqu'à 3 fois pour les autres erreurs
              return failureCount < 3;
            },
            // Refetch automatique quand la fenêtre reprend le focus
            refetchOnWindowFocus: true,
            // Refetch automatique lors de la reconnexion
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry automatique pour les mutations
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
