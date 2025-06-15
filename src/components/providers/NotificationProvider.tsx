'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface NotificationContextType {
  shouldEnableSSE: boolean;
  handleRouteChange: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  shouldEnableSSE: true,
  handleRouteChange: () => {},
});

export function useNotificationContext() {
  return useContext(NotificationContext);
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [shouldEnableSSE, setShouldEnableSSE] = useState(true);

  const handleRouteChange = () => {
    // Temporarily disable SSE during route changes
    setShouldEnableSSE(false);

    // Re-enable after a longer delay to allow navigation to complete fully
    setTimeout(() => {
      setShouldEnableSSE(true);
    }, 2000); // Increased from 1000ms to 2000ms to reduce connection churn
  };

  useEffect(() => {
    // For Next.js App Router, we need to listen to browser events
    const handlePopState = () => {
      handleRouteChange();
    };

    const handleBeforeUnload = () => {
      setShouldEnableSSE(false);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ shouldEnableSSE, handleRouteChange }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
