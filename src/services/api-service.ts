import { Client, Quote, Site, SupplyItem, LaborItem } from '../models/Quote';
import { PriceOffer } from '../models/PriceOffer';
import { authService } from './auth-service';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
    data: any;
    timestamp: number;
}

class ApiService {
    private cache = new Map<string, CacheEntry>();

    // Helper method for making API calls with retry logic
    private async fetchWithRetry<T>(
        url: string,
        options: RequestInit = {},
        retries = MAX_RETRIES
    ): Promise<T> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...options.headers as Record<string, string>,
            };

            // Add authorization header if user is authenticated
            const token = authService.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            // Handle 204 No Content responses
            if (response.status === 204) {
                return undefined as T;
            }

            return response.json();
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying API call, ${retries} attempts remaining...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return this.fetchWithRetry<T>(url, options, retries - 1);
            }
            throw error;
        }
    }

    // Helper method for making API calls
    private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const isGet = !options.method || options.method === 'GET';

        if (isGet) {
            const cached = this.cache.get(url);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log(`Returning cached data for: ${url}`);
                return cached.data;
            }
        }

        console.log(`Making API call to: ${url}`);
        const result = await this.fetchWithRetry<T>(url, options);

        if (isGet) {
            this.cache.set(url, { data: result, timestamp: Date.now() });
        }

        return result;
    }

    // Clear cache method to force fresh data after updates
    clearCache(): void {
        this.cache.clear();
        console.log('API cache cleared');
    }

    // Quotes
    async getQuotes(): Promise<Quote[]> {
        return this.fetchApi<Quote[]>('/quotes');
    }

    async getQuoteById(id: string): Promise<Quote | null> {
        try {
            return await this.fetchApi<Quote>(`/quotes/${id}`);
        } catch (error) {
            throw error;
        }
    }

    async saveQuote(quote: Quote): Promise<Quote> {
        console.log('[API SERVICE] saveQuote - === QUOTE DATA BEING SENT ===');
        console.log(JSON.stringify(quote, null, 2));
        console.log('[API SERVICE] saveQuote - === END QUOTE DATA ===');
        const result = await this.fetchApi<Quote>('/quotes', {
            method: 'POST',
            body: JSON.stringify(quote),
        });

        // Clear cache after save to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async deleteQuote(id: string): Promise<void> {
        await this.fetchApi(`/quotes/${id}`, {
            method: 'DELETE',
        });

        // Clear cache after delete to ensure fresh data on next fetch
        this.clearCache();
    }

    async updateQuote(quote: Quote): Promise<Quote> {
        console.log('[API SERVICE] updateQuote - === QUOTE DATA BEING SENT ===');
        console.log(JSON.stringify(quote, null, 2));
        console.log('[API SERVICE] updateQuote - === END QUOTE DATA ===');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if user is authenticated
        const token = authService.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/quotes/${quote.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(quote),
        });

        if (!response.ok) {
            throw new Error(`Failed to update quote: ${response.statusText}`);
        }

        // Clear cache after update to ensure fresh data on next fetch
        this.clearCache();

        return await response.json();
    }

    // Clients
    async getClients(): Promise<Client[]> {
        return this.fetchApi<Client[]>('/clients');
    }

    async getClientById(id: string): Promise<Client> {
        return this.fetchApi<Client>(`/clients/${id}`);
    }

    async saveClient(client: Omit<Client, 'id'> & { id?: string }): Promise<Client> {
        const result = await this.fetchApi<Client>('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });

        // Clear cache after save to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async deleteClient(id: string): Promise<void> {
        await this.fetchApi(`/clients/${id}`, {
            method: 'DELETE',
        });

        // Clear cache after delete to ensure fresh data on next fetch
        this.clearCache();
    }

    // Sites
    async getSitesByClientId(clientId: string): Promise<Site[]> {
        return this.fetchApi<Site[]>(`/sites/by-client?clientId=${clientId}`);
    }

    async saveSite(site: Omit<Site, 'id'> & { id?: string }): Promise<Site> {
        const result = await this.fetchApi<Site>('/sites', {
            method: 'POST',
            body: JSON.stringify(site),
        });

        // Clear cache after save to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async deleteSite(id: string): Promise<void> {
        await this.fetchApi(`/sites/${id}`, {
            method: 'DELETE',
        });

        // Clear cache after delete to ensure fresh data on next fetch
        this.clearCache();
    }

    // Supply Items
    async getSupplies(): Promise<SupplyItem[]> {
        return this.fetchApi<SupplyItem[]>('/items');
    }

    async getSupplyItems(quoteId: string): Promise<SupplyItem[]> {
        return this.fetchApi<SupplyItem[]>(`/supply-items/${quoteId}`);
    }

    async saveSupply(supply: Omit<SupplyItem, 'id'> & { id?: string }, quoteId: string): Promise<SupplyItem> {
        const result = await this.fetchApi<SupplyItem>(`/supply-items/${quoteId}`, {
            method: 'POST',
            body: JSON.stringify(supply),
        });

        // Clear cache after save to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async clearItems(): Promise<{ message: string; deletedCount: number }> {
        const result = await this.fetchApi<{ message: string; deletedCount: number }>('/items/clear', {
            method: 'DELETE'
        });

        // Clear cache after clear operation to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async deleteSupply(id: string): Promise<void> {
        await this.fetchApi(`/supply-items/${id}`, {
            method: 'DELETE',
        });

        // Clear cache after delete to ensure fresh data on next fetch
        this.clearCache();
    }

    // Descriptions
    async getDescriptions(): Promise<any[]> {
        return this.fetchApi<any[]>('/descriptions');
    }

    async createDescription(data: { content: string }): Promise<any> {
        const result = await this.fetchApi<any>('/descriptions', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Clear cache after create to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    // Labor Items
    async getLaborItems(quoteId: string): Promise<LaborItem[]> {
        return this.fetchApi<LaborItem[]>(`/labor-items/${quoteId}`);
    }

    // Splits
    async getSplits(): Promise<any[]> {
        return this.fetchApi<any[]>('/splits');
    }

    async getSplitsBySiteId(siteId: string): Promise<any[]> {
        return this.fetchApi<any[]>(`/splits/by-site/${siteId}`);
    }

    async createSplit(split: Omit<any, 'id'>): Promise<any> {
        const result = await this.fetchApi<any>('/splits', {
            method: 'POST',
            body: JSON.stringify(split),
        });

        // Clear cache after create to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async updateSplit(id: number, split: Partial<any>): Promise<any> {
        const result = await this.fetchApi<any>(`/splits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(split),
        });

        // Clear cache after update to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async deleteSplit(id: number): Promise<void> {
        await this.fetchApi(`/splits/${id}`, {
            method: 'DELETE',
        });

        // Clear cache after delete to ensure fresh data on next fetch
        this.clearCache();
    }

    async createLaborItem(quoteId: string, item: Omit<LaborItem, 'id'>): Promise<LaborItem> {
        const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/labor-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
        });

        if (!response.ok) {
            throw new Error(`Failed to create labor item: ${response.statusText}`);
        }

        // Clear cache after create to ensure fresh data on next fetch
        this.clearCache();

        return await response.json();
    }

    // Price Offers
    async getPriceOffers(): Promise<PriceOffer[]> {
        return this.fetchApi<PriceOffer[]>('/price-offers');
    }

    async createPriceOffer(offer: Omit<PriceOffer, 'createdAt' | 'updatedAt'>): Promise<PriceOffer> {
        const result = await this.fetchApi<PriceOffer>('/price-offers', {
            method: 'POST',
            body: JSON.stringify(offer)
        });

        // Clear cache after create to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    async createSupplyItem(quoteId: string, item: Omit<SupplyItem, 'id'>): Promise<SupplyItem> {
        const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/supply-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
        });

        if (!response.ok) {
            throw new Error(`Failed to create supply item: ${response.statusText}`);
        }

        // Clear cache after create to ensure fresh data on next fetch
        this.clearCache();

        return await response.json();
    }

    // Confirm a quote
    /**
     * Set the confirmation status of a quote.
     * @param id Quote ID
     * @param confirmed Boolean (true or false)
     * @param number_chanitec String (required)
     * @returns { message: string }
     */
    async confirmQuote(id: string, confirmed: boolean = true, number_chanitec: string): Promise<{ message: string }> {
        const result = await this.fetchApi<{ message: string }>(`/quotes/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify({ confirmed, number_chanitec }),
        });

        // Clear cache after update to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    // Set reminder date for a quote
    /**
     * Set or update a reminder date for quote follow-up.
     * @param id Quote ID
     * @param reminderDate String in "YYYY-MM-DD" format
     * @returns Quote object with updated reminder date
     */
    async setReminderDate(id: string, reminderDate: string): Promise<Quote> {
        const result = await this.fetchApi<Quote>(`/quotes/${id}/reminder`, {
            method: 'PATCH',
            body: JSON.stringify({ reminderDate }),
        });

        // Clear cache after update to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    // Exchange Rate
    async getExchangeRate(base: string = 'EUR', target: string = 'USD'): Promise<number> {
        const API_KEY = '8d8220c1bc4f1aa5e98ff382';
        const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }
        const data = await response.json();
        if (data.result !== 'success' || !data.conversion_rates || !data.conversion_rates[target]) {
            throw new Error('Invalid exchange rate data');
        }
        return data.conversion_rates[target];
    }

    // Inventory Management
    /**
     * Get all items/catalog
     */
    async getAllItems(): Promise<any[]> {
        return this.fetchApi<any[]>('/items');
    }

    /**
     * Get catalog item by ID
     * @param itemId Catalog item ID
     * @returns Catalog item data
     */
    async getCatalogItem(itemId: string): Promise<any> {
        try {
            const items = await this.getAllItems();
            return items.find(item => item.id === itemId) || null;
        } catch (error) {
            console.error('Error fetching catalog item:', error);
            return null;
        }
    }

    /**
     * Get item by ID
     */
    async getItemById(itemId: string): Promise<any> {
        return this.fetchApi<any>(`/items/${itemId}`);
    }

    /**
     * Import items from file
     */
    async importItems(formData: FormData): Promise<any> {
        const url = `${API_BASE_URL}/items/import`;
        const headers: Record<string, string> = {};
        const token = authService.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Import failed: ${response.statusText}`);
        }

        // Clear cache after import to ensure fresh data on next fetch
        this.clearCache();

        return response.json();
    }

    /**
     * Create a new catalog item
     */
    async createItem(item: any): Promise<any> {
        const result = await this.fetchApi<any>('/items', {
            method: 'POST',
            body: JSON.stringify(item),
        });

        // Clear cache after create to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    /**
     * Update a catalog item
     */
    async updateItem(itemId: string, item: any): Promise<any> {
        const result = await this.fetchApi<any>(`/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(item),
        });

        // Clear cache after update to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    /**
     * Delete a catalog item
     */
    async deleteItem(itemId: string): Promise<void> {
        await this.fetchApi(`/items/${itemId}`, {
            method: 'DELETE',
        });

        // Clear cache after delete to ensure fresh data on next fetch
        this.clearCache();
    }

    // Sites - Batch Operations
    /**
     * Get sites for multiple clients in a single request
     */
    async getSitesByClientIds(clientIds: string[]): Promise<{ [clientId: string]: Site[] }> {
        const idsParam = clientIds.join(',');
        return this.fetchApi<{ [clientId: string]: Site[] }>(`/sites/batch?clientIds=${idsParam}`);
    }

    /**
     * Get all sites
     */
    async getAllSites(): Promise<Site[]> {
        return this.fetchApi<Site[]>('/sites');
    }

    /**
     * Update a site
     */
    async updateSite(siteId: string, site: Partial<Site>): Promise<Site> {
        const result = await this.fetchApi<Site>(`/sites/${siteId}`, {
            method: 'PUT',
            body: JSON.stringify(site),
        });

        // Clear cache after update to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    // Clients - Additional Operations
    /**
     * Update an existing client
     */
    async updateClient(clientId: string, client: Partial<Client>): Promise<Client> {
        const result = await this.fetchApi<Client>(`/clients/${clientId}`, {
            method: 'PUT',
            body: JSON.stringify(client),
        });

        // Clear cache after update to ensure fresh data on next fetch
        this.clearCache();

        return result;
    }

    // Dashboard
    /**
     * Get dashboard summary stats (quotes, clients, splits count)
     */
    async getDashboardSummary(): Promise<{
        totalQuotes: number;
        totalClients: number;
        totalSplits: number;
        timestamp: string;
    }> {
        return this.fetchApi('/dashboard/summary');
    }

    /**
     * Get detailed dashboard stats
     */
    async getDashboardStats(): Promise<{
        totalQuotes: number;
        pendingQuotes: number;
        totalClients: number;
        totalSplits: number;
        timestamp: string;
    }> {
        return this.fetchApi('/dashboard/stats');
    }

    // Quotes - Filtered retrieval
    /**
     * Get quotes with optional filters and pagination
     */
    async getQuotesFiltered(options: {
        page?: number;
        limit?: number;
        clientId?: string;
        clientName?: string;
        dateFrom?: string;
        dateTo?: string;
        confirmed?: boolean;
    } = {}): Promise<any> {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.clientId) params.append('clientId', options.clientId);
        if (options.clientName) params.append('clientName', options.clientName);
        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);
        if (options.confirmed !== undefined) params.append('confirmed', options.confirmed.toString());

        const queryString = params.toString();
        return this.fetchApi(`/quotes${queryString ? '?' + queryString : ''}`);
    }

    /**
     * Get quote by ID with optional included items
     */
    async getQuoteByIdWithItems(id: string, includeItems: boolean = true): Promise<Quote> {
        const url = includeItems ? `/quotes/${id}?include=items` : `/quotes/${id}`;
        return this.fetchApi<Quote>(url);
    }

} // <-- Close ApiService class

// Export a singleton instance
export const apiService = new ApiService();