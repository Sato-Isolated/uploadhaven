"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNotificationContext } from '@/components/providers/NotificationProvider';

/**
 * Component to handle SSE connection management during Next.js navigation
 * This component should be included in layouts to prevent SSE errors during route changes
 */
export function NavigationSSEManager() {
  const pathname = usePathname();
  const { handleRouteChange } = useNotificationContext();

  useEffect(() => {
    // Handle route changes by temporarily disabling SSE
    handleRouteChange();
  }, [pathname, handleRouteChange]);

  return null; // This component doesn't render anything
}
