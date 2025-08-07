import { Client, Quote, Site, SupplyItem, LaborItem } from '../models/Quote';
import { PriceOffer } from '../models/PriceOffer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ApiService {
    // Helper method for making API calls with retry logic
    private async fetchWithRetry<T>(
        url: string,
        options: RequestInit = {},
        retries = MAX_RETRIES
    ): Promise<T> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
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
        console.log(`Making API call to: ${url}`);
        return this.fetchWithRetry<T>(url, options);
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
        return this.fetchApi<Quote>('/quotes', {
            method: 'POST',
            body: JSON.stringify(quote),
        });
    }

    async deleteQuote(id: string): Promise<void> {
        await this.fetchApi(`/quotes/${id}`, {
            method: 'DELETE',
        });
    }

    async updateQuote(quote: Quote): Promise<Quote> {
        const response = await fetch(`${API_BASE_URL}/quotes/${quote.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quote),
        });

        if (!response.ok) {
            throw new Error(`Failed to update quote: ${response.statusText}`);
        }

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
        return this.fetchApi<Client>('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });
    }

    async deleteClient(id: string): Promise<void> {
        await this.fetchApi(`/clients/${id}`, {
            method: 'DELETE',
        });
    }

    // Sites
    async getSitesByClientId(clientId: string): Promise<Site[]> {
        return this.fetchApi<Site[]>(`/sites/by-client?clientId=${clientId}`);
    }

    async saveSite(site: Omit<Site, 'id'> & { id?: string }): Promise<Site> {
        return this.fetchApi<Site>('/sites', {
            method: 'POST',
            body: JSON.stringify(site),
        });
    }

    async deleteSite(id: string): Promise<void> {
        await this.fetchApi(`/sites/${id}`, {
            method: 'DELETE',
        });
    }

    // Supply Items
    async getSupplies(): Promise<SupplyItem[]> {
        return this.fetchApi<SupplyItem[]>('/items');
    }

    async getSupplyItems(quoteId: string): Promise<SupplyItem[]> {
        return this.fetchApi<SupplyItem[]>(`/supply-items/${quoteId}`);
    }

    async saveSupply(supply: Omit<SupplyItem, 'id'> & { id?: string }, quoteId: string): Promise<SupplyItem> {
        return this.fetchApi<SupplyItem>(`/supply-items/${quoteId}`, {
            method: 'POST',
            body: JSON.stringify(supply),
        });
    }

    async clearItems(): Promise<{ message: string; deletedCount: number }> {
        return this.fetchApi('/items/clear', {
            method: 'DELETE'
        });
    }

    async deleteSupply(id: string): Promise<void> {
        await this.fetchApi(`/supply-items/${id}`, {
            method: 'DELETE',
        });
    }

    // Labor Items
    async getLaborItems(quoteId: string): Promise<LaborItem[]> {
        return this.fetchApi<LaborItem[]>(`/labor-items/${quoteId}`);
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

        return await response.json();
    }

    // Price Offers
    async getPriceOffers(): Promise<PriceOffer[]> {
        return this.fetchApi<PriceOffer[]>('/price-offers');
    }

    async createPriceOffer(offer: Omit<PriceOffer, 'createdAt' | 'updatedAt'>): Promise<PriceOffer> {
        return this.fetchApi<PriceOffer>('/price-offers', {
            method: 'POST',
            body: JSON.stringify(offer)
        });
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
        return this.fetchApi<{ message: string }>(`/quotes/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify({ confirmed, number_chanitec }),
        });
    }

    // Set reminder date for a quote
    /**
     * Set or update a reminder date for quote follow-up.
     * @param id Quote ID
     * @param reminderDate String in "YYYY-MM-DD" format
     * @returns Quote object with updated reminder date
     */
    async setReminderDate(id: string, reminderDate: string): Promise<Quote> {
        return this.fetchApi<Quote>(`/quotes/${id}/reminder`, {
            method: 'PATCH',
            body: JSON.stringify({ reminderDate }),
        });
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
}

// Export a singleton instance
export const apiService = new ApiService();