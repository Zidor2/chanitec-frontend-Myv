import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { enhancedStorageService } from '../services/enhanced-storage-service';
import './CacheStatus.scss';

export const CacheStatus: React.FC = () => {
  const { isOnline, isConnecting } = useNetworkStatus();
  const [cacheStatus, setCacheStatus] = React.useState(enhancedStorageService.getCacheStatus());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!isOnline) return;

    setIsRefreshing(true);
    try {
      await enhancedStorageService.forceRefresh();
      setCacheStatus(enhancedStorageService.getCacheStatus());
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="cache-status">
      <div className="status-indicators">
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>

        {isConnecting && (
          <div className="status-indicator connecting">
            <span className="status-dot"></span>
            Connexion...
          </div>
        )}

        <div className={`status-indicator ${cacheStatus.isStale ? 'stale' : 'fresh'}`}>
          <span className="status-dot"></span>
          {cacheStatus.isStale ? 'Cache obsolète' : 'Cache à jour'}
        </div>
      </div>

      {isOnline && (
        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      )}

      <div className="cache-info">
        <small>
          Dernière mise à jour: {cacheStatus.lastUpdated ?
            new Date(cacheStatus.lastUpdated).toLocaleString('fr-FR') :
            'Jamais'
          }
        </small>
      </div>
    </div>
  );
};
