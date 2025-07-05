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
            // Time before a query is considered "stale"
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Cache time before garbage collection
            gcTime: 10 * 60 * 1000, // 10 minutes
            // Automatic retry on failure
            retry: (failureCount, error: unknown) => {
              // Don't retry for 4xx errors (client errors)
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Automatic refetch when window regains focus
            refetchOnWindowFocus: true,
            // Automatic refetch on reconnection
            refetchOnReconnect: true,
          },
          mutations: {
            // Automatic retry for mutations
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
