import { Client, Quote, Site, SupplyItem } from '../models/Quote';
import { generateId, generateQuoteId } from '../utils/id-generator';
import sampleItems from '../data/sample-items.json';

/**
 * Storage keys used by the application
 */
const STORAGE_KEYS = {
  QUOTES: 'quotes',
  CLIENTS: 'clients',
  SITES: 'sites',
  SUPPLIES: 'supplies',
  INITIALIZED: 'app_initialized',
};

/**
 * Storage Service - Manages all data persistence in the application
 * This is designed to be easily replaced with a real backend API in the future
 */
class StorageService {
  constructor() {
    this.initializeDataIfNeeded();
  }

  /**
   * Initialize data from sample files if the app is running for the first time
   */
  private initializeDataIfNeeded(): void {
    // Check if the app has been initialized before
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (!initialized) {
      console.log('Initializing app with sample data...');

      // Load sample items if the supplies store is empty
      const existingSupplies = this.getSupplies();
      if (existingSupplies.length === 0) {
        try {
          // Import items from sample-items.json
          const items = sampleItems as SupplyItem[];
          items.forEach(item => {
            this.saveSupply({
              item_id: item.id, // Include the item_id from the sample data
              description: item.description,
              priceEuro: item.priceEuro,
              quantity: item.quantity || 1,
              priceDollar: 0, // Will be calculated by backend
              unitPriceDollar: 0, // Will be calculated by backend
              totalPriceDollar: 0 // Will be calculated by backend
            });
          });
          console.log(`Loaded ${items.length} sample items successfully`);
        } catch (error) {
          console.error('Failed to load sample items:', error);
        }
      }

      // Mark as initialized
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  /**
   * Get data from localStorage with a fallback default value
   */
  private getFromStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Silent fail - storage errors shouldn't break the app
    }
  }

  // Quotes
  getQuotes(): Quote[] {
    return this.getFromStorage<Quote[]>(STORAGE_KEYS.QUOTES) || [];
  }

  getQuoteById(id: string): Quote | undefined {
    return this.getQuotes().find(quote => quote.id === id);
  }

  saveQuote(quote: Quote): Quote {
    const quotes = this.getQuotes();
    const existingIndex = quotes.findIndex(q => q.id === quote.id);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Update existing quote
      const updatedQuote = {
        ...quote,
        updatedAt: now
      };
      quotes[existingIndex] = updatedQuote;
      this.saveToStorage(STORAGE_KEYS.QUOTES, quotes);
      return updatedQuote;
    } else {
      // Create new quote
      const newQuote = {
        ...quote,
        id: quote.id || generateQuoteId(),
        createdAt: now,
        updatedAt: now
      };
      quotes.push(newQuote);
      this.saveToStorage(STORAGE_KEYS.QUOTES, quotes);
      return newQuote;
    }
  }

  deleteQuote(id: string): boolean {
    const quotes = this.getQuotes();
    const filteredQuotes = quotes.filter(quote => quote.id !== id);

    if (filteredQuotes.length !== quotes.length) {
      this.saveToStorage(STORAGE_KEYS.QUOTES, filteredQuotes);
      return true;
    }

    return false;
  }

  // Clients
  getClients(): Client[] {
    return this.getFromStorage<Client[]>(STORAGE_KEYS.CLIENTS) || [];
  }

  getClientById(id: string): Client | undefined {
    return this.getClients().find(client => client.id === id);
  }

  saveClient(client: Omit<Client, 'id'> & { id?: string }): Client {
    const clients = this.getClients();

    if (client.id) {
      // Update existing client
      const existingIndex = clients.findIndex(c => c.id === client.id);
      if (existingIndex >= 0) {
        const updatedClient = { ...client, id: client.id } as Client;
        clients[existingIndex] = updatedClient;
        this.saveToStorage(STORAGE_KEYS.CLIENTS, clients);
        return updatedClient;
      }
    }

    // Create new client
    const newClient = { ...client, id: generateId() } as Client;
    clients.push(newClient);
    this.saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  }

  deleteClient(id: string): void {
    const clients = this.getClients();
    const filteredClients = clients.filter(client => client.id !== id);

    if (filteredClients.length === clients.length) {
      throw new Error(`Client with ID ${id} not found`);
    }

    // Also delete sites for this client
    const sites = this.getSites();
    const filteredSites = sites.filter(site => site.client_id !== id);
    this.saveToStorage(STORAGE_KEYS.SITES, filteredSites);

    this.saveToStorage(STORAGE_KEYS.CLIENTS, filteredClients);
  }

  // Sites
  getSites(): Site[] {
    return this.getFromStorage<Site[]>(STORAGE_KEYS.SITES) || [];
  }

  getSitesByClientId(clientId: string): Site[] {
    return this.getSites().filter(site => site.client_id === clientId);
  }

  saveSite(site: Omit<Site, 'id'> & { id?: string }): Site {
    const sites = this.getSites();

    if (site.id) {
      // Update existing site
      const existingIndex = sites.findIndex(s => s.id === site.id);
      if (existingIndex >= 0) {
        const updatedSite = { ...site, id: site.id } as Site;
        sites[existingIndex] = updatedSite;
        this.saveToStorage(STORAGE_KEYS.SITES, sites);
        return updatedSite;
      }
    }

    // Create new site
    const newSite = { ...site, id: generateId() } as Site;
    sites.push(newSite);
    this.saveToStorage(STORAGE_KEYS.SITES, sites);
    return newSite;
  }

  deleteSite(id: string): boolean {
    const sites = this.getSites();
    const filteredSites = sites.filter(site => site.id !== id);

    if (filteredSites.length !== sites.length) {
      this.saveToStorage(STORAGE_KEYS.SITES, filteredSites);
      return true;
    }

    return false;
  }

  // Supplies (product catalog)
  getSupplies(): SupplyItem[] {
    return this.getFromStorage<SupplyItem[]>(STORAGE_KEYS.SUPPLIES) || [];
  }

  saveSupply(supply: Omit<SupplyItem, 'id'> & { id?: string }): SupplyItem {
    const supplies = this.getSupplies();

    if (supply.id) {
      // Update existing supply
      const existingIndex = supplies.findIndex(s => s.id === supply.id);
      if (existingIndex >= 0) {
        const updatedSupply = { ...supply, id: supply.id } as SupplyItem;
        supplies[existingIndex] = updatedSupply;
        this.saveToStorage(STORAGE_KEYS.SUPPLIES, supplies);
        return updatedSupply;
      }
    }

    // Create new supply
    const newSupply = {
      ...supply,
      id: generateId(),
      quantity: supply.quantity || 1
    } as SupplyItem;

    supplies.push(newSupply);
    this.saveToStorage(STORAGE_KEYS.SUPPLIES, supplies);
    return newSupply;
  }

  deleteSupply(id: string): boolean {
    const supplies = this.getSupplies();
    const filteredSupplies = supplies.filter(supply => supply.id !== id);

    if (filteredSupplies.length !== supplies.length) {
      this.saveToStorage(STORAGE_KEYS.SUPPLIES, filteredSupplies);
      return true;
    }

    return false;
  }
}

// Export a singleton instance
export const storageService = new StorageService();