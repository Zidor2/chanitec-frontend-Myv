import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    lastOffline: navigator.onLine ? null : new Date(),
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastOnline: new Date(),
      }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        lastOffline: new Date(),
      }));
    };

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connectivity periodically when offline
    const connectivityInterval = setInterval(async () => {
      if (!navigator.onLine) {
        setNetworkStatus(prev => ({ ...prev, isConnecting: true }));

        try {
          // Try to reach a reliable endpoint
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          await fetch('/api/health', {
            signal: controller.signal,
            method: 'HEAD' // Lightweight request
          });

          clearTimeout(timeoutId);
          handleOnline();
        } catch (error) {
          setNetworkStatus(prev => ({ ...prev, isConnecting: false }));
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, []);

  return networkStatus;
};
