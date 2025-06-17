'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to safely get the current origin in both SSR and CSR contexts
 * Uses environment variable as fallback for SSR, then switches to actual origin in CSR
 */
export function useOrigin(): string | null {
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    // On client side, use actual window.location.origin
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Use environment variable for SSR, then actual origin for CSR
  return origin || process.env.NEXT_PUBLIC_BASE_URL || null;
}

/**
 * Server-side utility to get origin from request headers
 * Use this in API routes and Server Components
 */

