import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to detect connectivity issues
 * Returns true if offline or if there are network-related query errors
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if there are any failed queries that might be network-related
  const hasNetworkErrors = () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    return queries.some((query) => {
      const error = query.state.error;
      if (!error) return false;
      
      // Check if error is network-related
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorString = errorMessage.toLowerCase();
      
      return (
        errorString.includes('network') ||
        errorString.includes('fetch') ||
        errorString.includes('connection') ||
        errorString.includes('timeout') ||
        errorString.includes('econnrefused') ||
        errorString.includes('enotfound') ||
        errorString.includes('failed to fetch')
      );
    });
  };

  const isOffline = !isOnline;
  const hasConnectivityIssue = isOffline || hasNetworkErrors();

  return {
    isOnline,
    isOffline,
    hasConnectivityIssue,
  };
}

