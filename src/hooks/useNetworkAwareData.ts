import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { enhancedStorageService } from '../services/enhanced-storage-service';
import { Client, Quote, Site, SupplyItem } from '../models/Quote';

interface NetworkAwareData<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isFromCache: boolean;
  refresh: () => Promise<void>;
}

export const useNetworkAwareData = <T>(
  dataType: 'quotes' | 'clients' | 'sites' | 'supplies',
  fetcher: () => Promise<T[]>
): NetworkAwareData<T> => {
  const { isOnline, isConnecting } = useNetworkStatus();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      let result: T[];

      if (forceRefresh && isOnline) {
        // Force refresh from database
        result = await fetcher();
        setIsFromCache(false);
        setLastUpdated(new Date().toISOString());
      } else {
        // Load from cache first using type-safe method calls
        switch (dataType) {
          case 'quotes':
            result = await enhancedStorageService.getQuotes() as T[];
            break;
          case 'clients':
            result = await enhancedStorageService.getClients() as T[];
            break;
          case 'sites':
            result = await enhancedStorageService.getSites() as T[];
            break;
          case 'supplies':
            result = await enhancedStorageService.getSupplies() as T[];
            break;
          default:
            throw new Error(`Unknown data type: ${dataType}`);
        }
        setIsFromCache(true);

        // If online and cache is stale, refresh in background
        if (isOnline) {
          enhancedStorageService.forceRefresh().then(() => {
            setData(result);
            setIsFromCache(false);
            setLastUpdated(new Date().toISOString());
          }).catch(console.error);
        }
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [dataType, fetcher, isOnline]);

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when coming back online
  useEffect(() => {
    if (isOnline && !isConnecting) {
      loadData(true);
    }
  }, [isOnline, isConnecting, loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    isFromCache,
    refresh,
  };
};

// Convenience hooks for each data type
export const useNetworkAwareQuotes = () =>
  useNetworkAwareData('quotes', () => enhancedStorageService.getQuotes());

export const useNetworkAwareClients = () =>
  useNetworkAwareData('clients', () => enhancedStorageService.getClients());

export const useNetworkAwareSites = () =>
  useNetworkAwareData('sites', () => enhancedStorageService.getSites());

export const useNetworkAwareSupplies = () =>
  useNetworkAwareData('supplies', () => enhancedStorageService.getSupplies());
