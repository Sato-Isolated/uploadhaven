'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { PrefetchManager } from '@/lib/prefetch';

interface PrefetchContextType {
  prefetchManager: PrefetchManager;
  prefetchUserData: (userId: string) => void;
  prefetchAdminData: () => void;
  prefetchFilesData: (userId?: string) => void;
}

const PrefetchContext = createContext<PrefetchContextType | null>(null);

interface PrefetchProviderProps {
  children: React.ReactNode;
}

export function PrefetchProvider({ children }: PrefetchProviderProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // Create prefetch manager instance
  const prefetchManager = useMemo(
    () => new PrefetchManager(queryClient),
    [queryClient]
  );

  // Context value
  const contextValue = useMemo(
    () => ({
      prefetchManager,
      prefetchUserData: (userId: string) => {
        prefetchManager.prefetchUserStats(userId);
        prefetchManager.prefetchUserAnalytics(userId);
      },
      prefetchAdminData: () => {
        prefetchManager.prefetchAdminDashboard();
      },
      prefetchFilesData: (userId?: string) => {
        prefetchManager.prefetchFilesList(userId);
      },
    }),
    [prefetchManager]
  ); // Smart prefetching based on route changes
  useEffect(() => {
    // Basic prefetching logic without session dependency
    // In a real app, you would get user info from your auth system

    if (pathname === '/admin') {
      prefetchManager.prefetchAdminDashboard();
    } else if (pathname === '/dashboard') {
      prefetchManager.prefetchFilesList();
    }
  }, [pathname, prefetchManager]);

  // Prefetch on hover/focus events (add event listeners)
  useEffect(() => {
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (!link) return;

      const href = link.getAttribute('href');

      // Prefetch based on link destination
      switch (true) {
        case href?.includes('/dashboard'):
          prefetchManager.prefetchUserStats('demo-user');
          break;
        case href?.includes('/admin'):
          prefetchManager.prefetchAdminDashboard();
          break;
        case href?.includes('/files'):
          prefetchManager.prefetchFilesList();
          break;
        case href?.includes('/analytics'):
          prefetchManager.prefetchUserAnalytics('demo-user');
          break;
      }
    };

    // Add hover listeners to document
    document.addEventListener('mouseover', handleLinkHover);

    return () => {
      document.removeEventListener('mouseover', handleLinkHover);
    };
  }, [prefetchManager]);

  return (
    <PrefetchContext.Provider value={contextValue}>
      {children}
    </PrefetchContext.Provider>
  );
}

export function usePrefetch() {
  const context = useContext(PrefetchContext);
  if (!context) {
    throw new Error('usePrefetch must be used within a PrefetchProvider');
  }
  return context;
}
