import { useState, useEffect } from 'react';
import { clientsApi } from '../services/api';

export const useClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all clients
    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await clientsApi.getAllClients();
            setClients(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create new client
    const createClient = async (clientData) => {
        setLoading(true);
        try {
            const newClient = await clientsApi.createClient(clientData);
            setClients(prevClients => [...prevClients, newClient]);
            setError(null);
            return newClient;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Load clients on component mount
    useEffect(() => {
        fetchClients();
    }, []);

    return {
        clients,
        loading,
        error,
        fetchClients,
        createClient
    };
};