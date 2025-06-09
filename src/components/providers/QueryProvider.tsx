'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => 
    new QueryClient({
      defaultOptions: {
        queries: {
          // Stale time: how long data is considered fresh
          staleTime: 5 * 60 * 1000, // 5 minutes
          // Garbage collection time: when to remove data from cache
          gcTime: 10 * 60 * 1000, // 10 minutes
          // Retry configuration with exponential backoff
          retry: 2,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          // Refetch behavior optimized for file upload app
          refetchOnWindowFocus: false, // Prevent unnecessary requests on focus
          refetchOnReconnect: true, // Refresh data when connection restored
          refetchOnMount: true, // Always fetch fresh data on component mount
          // Network mode for better offline handling
          networkMode: 'online',
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
          // Network mode for mutations
          networkMode: 'online',
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools 
        initialIsOpen={false} 
        buttonPosition="bottom-left"
      />
    </QueryClientProvider>
  );
}
