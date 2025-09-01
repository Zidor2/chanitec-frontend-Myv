import { storageService } from './storage-service';
import { apiService } from './api-service';
import { Client, Quote, Site, SupplyItem } from '../models/Quote';

interface CacheMetadata {
  lastUpdated: string;
  version: string;
  isStale: boolean;
}

const CACHE_METADATA_KEY = 'cache_metadata';
const CACHE_VERSION = '1.0.0';

class EnhancedStorageService {
  private cacheMetadata: CacheMetadata = {
    lastUpdated: new Date().toISOString(),
    version: CACHE_VERSION,
    isStale: false,
  };

  constructor() {
    this.loadCacheMetadata();
  }

  private loadCacheMetadata(): void {
    try {
      const stored = localStorage.getItem(CACHE_METADATA_KEY);
      if (stored) {
        this.cacheMetadata = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load cache metadata:', error);
    }
  }

  private saveCacheMetadata(): void {
    try {
      localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(this.cacheMetadata));
    } catch (error) {
      console.warn('Failed to save cache metadata:', error);
    }
  }

  private markCacheAsStale(): void {
    this.cacheMetadata.isStale = true;
    this.cacheMetadata.lastUpdated = new Date().toISOString();
    this.saveCacheMetadata();
  }

  private async invalidateCache(): Promise<void> {
    console.log('🔄 Invalidating cache and fetching fresh data...');

    try {
      // Clear all cached data
      const storageKeys = ['quotes', 'clients', 'sites', 'supplies'];
      storageKeys.forEach(key => localStorage.removeItem(key));

      // Fetch fresh data from database
      const [quotes, clients, supplies] = await Promise.all([
        apiService.getQuotes(),
        apiService.getClients(),
        apiService.getSupplies(),
      ]);

      // Save fresh data to cache
      localStorage.setItem('quotes', JSON.stringify(quotes));
      localStorage.setItem('clients', JSON.stringify(clients));
      localStorage.setItem('supplies', JSON.stringify(supplies));

      // Update cache metadata
      this.cacheMetadata = {
        lastUpdated: new Date().toISOString(),
        version: CACHE_VERSION,
        isStale: false,
      };
      this.saveCacheMetadata();

      console.log('✅ Cache refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh cache:', error);
      // Mark cache as stale so we can retry later
      this.markCacheAsStale();
      throw error;
    }
  }

  /**
   * Check if cache should be invalidated and refresh if needed
   */
  async ensureFreshData(): Promise<void> {
    // If cache is marked as stale, refresh it
    if (this.cacheMetadata.isStale) {
      await this.invalidateCache();
    }
  }

  /**
   * Force cache refresh (called when internet connection is restored)
   */
  async forceRefresh(): Promise<void> {
    await this.invalidateCache();
  }

  /**
   * Get data with cache-first strategy, but mark for refresh if stale
   */
  async getQuotes(): Promise<Quote[]> {
    // Always return from cache first for immediate response
    const cachedQuotes = storageService.getQuotes();

    // If cache is stale, trigger refresh in background
    if (this.cacheMetadata.isStale) {
      this.invalidateCache().catch(console.error);
    }

    return cachedQuotes;
  }

  async getClients(): Promise<Client[]> {
    const cachedClients = storageService.getClients();

    if (this.cacheMetadata.isStale) {
      this.invalidateCache().catch(console.error);
    }

    return cachedClients;
  }

  async getSites(): Promise<Site[]> {
    const cachedSites = storageService.getSites();

    if (this.cacheMetadata.isStale) {
      this.invalidateCache().catch(console.error);
    }

    return cachedSites;
  }

  async getSupplies(): Promise<SupplyItem[]> {
    const cachedSupplies = storageService.getSupplies();

    if (this.cacheMetadata.isStale) {
      this.invalidateCache().catch(console.error);
    }

    return cachedSupplies;
  }

  // Delegate other methods to the original storage service
  getQuoteById = storageService.getQuoteById.bind(storageService);
  saveQuote = storageService.saveQuote.bind(storageService);
  deleteQuote = storageService.deleteQuote.bind(storageService);
  getClientById = storageService.getClientById.bind(storageService);
  saveClient = storageService.saveClient.bind(storageService);
  deleteClient = storageService.deleteClient.bind(storageService);
  getSitesByClientId = storageService.getSitesByClientId.bind(storageService);
  saveSite = storageService.saveSite.bind(storageService);
  deleteSite = storageService.deleteSite.bind(storageService);
  saveSupply = storageService.saveSupply.bind(storageService);
  deleteSupply = storageService.deleteSupply.bind(storageService);

  /**
   * Get cache status information
   */
  getCacheStatus(): CacheMetadata {
    return { ...this.cacheMetadata };
  }

  /**
   * Clear all cached data and reset cache metadata
   */
  clearCache(): void {
    console.log('🧹 Clearing all cached data...');

    try {
      // Clear all cached data
      const storageKeys = ['quotes', 'clients', 'sites', 'supplies'];
      storageKeys.forEach(key => localStorage.removeItem(key));

      // Reset cache metadata
      this.cacheMetadata = {
        lastUpdated: new Date().toISOString(),
        version: CACHE_VERSION,
        isStale: false,
      };
      this.saveCacheMetadata();

      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }
}

export const enhancedStorageService = new EnhancedStorageService();
