import { useState, useEffect } from 'react';
import { apiService } from '../services/api-service';

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

      // Use the new optimized dashboard endpoint (single API call instead of 3)
      const dashboardStats = await apiService.getDashboardStats();

      console.log('Dashboard stats fetched:', dashboardStats);

      setStats({
        totalQuotes: dashboardStats.totalQuotes,
        pendingQuotes: dashboardStats.pendingQuotes,
        totalClients: dashboardStats.totalClients,
        totalSplits: dashboardStats.totalSplits
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
