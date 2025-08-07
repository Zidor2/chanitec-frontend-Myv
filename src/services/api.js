const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Items API calls
export const itemsApi = {
    getAllItems: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/items`);
            if (!response.ok) throw new Error('Failed to fetch items');
            return await response.json();
        } catch (error) {
            console.error('Error fetching items:', error);
            throw error;
        }
    },

    getItemById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/items/${id}`);
            if (!response.ok) throw new Error('Failed to fetch item');
            return await response.json();
        } catch (error) {
            console.error('Error fetching item:', error);
            throw error;
        }
    },

    createItem: async (itemData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...itemData,
                    quantity: itemData.quantity === undefined || itemData.quantity === null ? 0 : itemData.quantity
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create item');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating item:', error);
            throw error;
        }
    },

    createItemWithCustomId: async (itemData) => {
        try {
            // Try to create item with custom ID
            const response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: itemData.id, // Include custom ID
                    description: itemData.description,
                    price: itemData.price,
                    quantity: itemData.quantity === undefined || itemData.quantity === null ? 0 : itemData.quantity
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create item with custom ID');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating item with custom ID:', error);
            throw error;
        }
    },

    updateItem: async (id, itemData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/items/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...itemData,
                    quantity: itemData.quantity === undefined || itemData.quantity === null ? 0 : itemData.quantity
                }),
            });
            if (!response.ok) throw new Error('Failed to update item');
            return await response.json();
        } catch (error) {
            console.error('Error updating item:', error);
            throw error;
        }
    },

    deleteItem: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/items/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete item');
            return true;
        } catch (error) {
            console.error('Error deleting item:', error);
            throw error;
        }
    },

    importItems: async (formData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/items/import`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Failed to import items');
            return await response.json();
        } catch (error) {
            console.error('Error importing items:', error);
            throw error;
        }
    },

    clearItems: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/items/clear`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to clear items');
            return await response.json();
        } catch (error) {
            console.error('Error clearing items:', error);
            throw error;
        }
    }
};


// Quotes API calls
export const quotesApi = {
    getAllQuotes: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes`);
            if (!response.ok) throw new Error('Failed to fetch quotes');
            return await response.json();
        } catch (error) {
            console.error('Error fetching quotes:', error);
            throw error;
        }
    },

    getQuoteById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes/${id}`);
            if (!response.ok) throw new Error('Failed to fetch quote');
            return await response.json();
        } catch (error) {
            console.error('Error fetching quote:', error);
            throw error;
        }
    },

    createQuote: async (quoteData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quoteData),
            });
            if (!response.ok) throw new Error('Failed to create quote');
            return await response.json();
        } catch (error) {
            console.error('Error creating quote:', error);
            throw error;
        }
    },

    updateQuote: async (id, quoteData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quoteData),
            });
            if (!response.ok) throw new Error('Failed to update quote');
            return await response.json();
        } catch (error) {
            console.error('Error updating quote:', error);
            throw error;
        }
    },

    deleteQuote: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete quote');
            return true;
        } catch (error) {
            console.error('Error deleting quote:', error);
            throw error;
        }
    },
};

// Clients API calls
export const clientsApi = {
    getAllClients: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/clients`);
            if (!response.ok) throw new Error('Failed to fetch clients');
            const clients = await response.json();

            // Fetch sites for each client
            const clientsWithSites = await Promise.all(
                clients.map(async (client) => {
                    const siteResponse = await fetch(`${API_BASE_URL}/sites?client_id=${client.id}`);
                    if (siteResponse.ok) {
                        const sites = await siteResponse.json();
                        return { ...client, site: sites[0] }; // Assuming one site per client for now
                    }
                    return client;
                })
            );

            return clientsWithSites;
        } catch (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }
    },

    createClient: async (clientData) => {
        try {
            // First create the client
            const clientResponse = await fetch(`${API_BASE_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: clientData.name }),
            });

            if (!clientResponse.ok) {
                const errorData = await clientResponse.json();
                throw new Error(errorData.error || 'Failed to create client');
            }

            const newClient = await clientResponse.json();

            // Then create the site for this client
            if (clientData.site) {
                const siteResponse = await fetch(`${API_BASE_URL}/sites`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...clientData.site,
                        client_id: newClient.id
                    }),
                });

                if (!siteResponse.ok) {
                    const errorData = await siteResponse.json();
                    throw new Error(errorData.error || 'Failed to create site');
                }

                const newSite = await siteResponse.json();
                return { ...newClient, site: newSite };
            }

            return newClient;
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    },
};

// Sites API calls
export const sitesApi = {
    getAllSites: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sites`);
            if (!response.ok) throw new Error('Failed to fetch sites');
            return await response.json();
        } catch (error) {
            console.error('Error fetching sites:', error);
            throw error;
        }
    },

    createSite: async (siteData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(siteData),
            });
            if (!response.ok) throw new Error('Failed to create site');
            return await response.json();
        } catch (error) {
            console.error('Error creating site:', error);
            throw error;
        }
    },
};