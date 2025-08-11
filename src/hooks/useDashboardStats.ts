import { useState, useEffect } from 'react';
import { apiService } from '../services/api-service';
import { Quote, Client } from '../models/Quote';

export interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  totalClients: number;
  totalSplits: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    pendingQuotes: 0,
    totalClients: 0,
    totalSplits: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

                  // Fetch all quotes
      const quotes: Quote[] = await apiService.getQuotes();

      // Fetch all clients
      const clients: Client[] = await apiService.getClients();

            // Fetch all splits directly
      let splits;
      try {
        splits = await apiService.getSplits();
        console.log('Raw splits response:', splits);
      } catch (splitsError) {
        console.error('Error fetching splits:', splitsError);
        splits = [];
      }

      // Ensure we have valid arrays
      const validQuotes = Array.isArray(quotes) ? quotes : [];
      const validClients = Array.isArray(clients) ? clients : [];
      const validSplits = Array.isArray(splits) ? splits : [];

      // Debug logging
      console.log('Fetched quotes:', quotes);
      console.log('Fetched clients:', clients);
      console.log('Fetched splits:', splits);
      console.log('Valid quotes:', validQuotes);
      console.log('Valid clients:', validClients);
      console.log('Valid splits:', validSplits);
      console.log('Valid splits length:', validSplits.length);
      console.log('Valid splits type:', typeof validSplits);
      console.log('Valid splits isArray:', Array.isArray(validSplits));

      // Calculate statistics
      const totalQuotes = validQuotes.length;
      const pendingQuotes = validQuotes.filter(quote =>
        quote && !quote.confirmed
      ).length;

      const totalClients = validClients.length;

            // Calculate total splits directly from splits array
      const totalSplits = validSplits.length;

      console.log('Total splits calculated:', totalSplits);

      setStats({
        totalQuotes,
        pendingQuotes,
        totalClients,
        totalSplits
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');

      // Set fallback values on error
      setStats({
        totalQuotes: 0,
        pendingQuotes: 0,
        totalClients: 0,
        totalSplits: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
