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
export function getServerOrigin(headers: Headers): string {
  const host = headers.get('host');
  const protocol = headers.get('x-forwarded-proto') || 'http';

  if (!host) {
    // Fallback to environment variable
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  return `${protocol}://${host}`;
}

/**
 * Utility to build full URLs consistently across the app
 */
export function buildFullUrl(path: string, origin?: string): string {
  const baseOrigin =
    origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseOrigin}${cleanPath}`;
}
