# Cache Implementation Guide

## Overview

This implementation provides a cache-first strategy with automatic database synchronization when internet connectivity is available. The app loads data from cache immediately for instant response, then automatically updates with fresh database data when online.

## How It Works

### 1. Cache-First Strategy
- **Immediate Response**: Data loads instantly from localStorage cache
- **Background Sync**: When online, cache is refreshed with database data
- **Seamless Experience**: Users see data immediately, updates happen in background

### 2. Network Detection
- **Automatic Detection**: Monitors online/offline status
- **Periodic Checks**: Tests connectivity every 10 seconds when offline
- **Smart Reconnection**: Automatically detects when internet is restored

### 3. Cache Invalidation
- **Automatic Refresh**: Cache is wiped and updated when coming back online
- **Manual Refresh**: Users can manually refresh cache with button
- **Status Indicators**: Visual feedback showing cache and network status

## Components

### CacheStatus Component
Displays network status and cache information in the app header.

**Features:**
- Online/Offline status indicator
- Cache freshness status
- Manual refresh button
- Last update timestamp

### Network Status Hook
```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const { isOnline, isConnecting, lastOnline, lastOffline } = useNetworkStatus();
```

**Returns:**
- `isOnline`: Boolean indicating internet connectivity
- `isConnecting`: Boolean indicating connection attempt in progress
- `lastOnline`: Date when last online
- `lastOffline`: Date when last offline

### Network-Aware Data Hooks
Replace existing data loading with network-aware versions:

```typescript
// Before (direct API calls)
const [clients, setClients] = useState<Client[]>([]);

useEffect(() => {
  const loadClients = async () => {
    const response = await fetch('/api/clients');
    const data = await response.json();
    setClients(data);
  };
  loadClients();
}, []);

// After (network-aware with cache)
const { data: clients, isLoading, error, isFromCache, refresh } = useNetworkAwareClients();
```

**Available Hooks:**
- `useNetworkAwareQuotes()`
- `useNetworkAwareClients()`
- `useNetworkAwareSites()`
- `useNetworkAwareSupplies()`

**Returns:**
- `data`: Array of items from cache or database
- `isLoading`: Boolean indicating loading state
- `error`: Error message if any
- `lastUpdated`: Timestamp of last update
- `isFromCache`: Boolean indicating if data is from cache
- `refresh`: Function to manually refresh data

## Integration Examples

### Example 1: ClientsPage Integration
```typescript
import { useNetworkAwareClients } from '../../hooks/useNetworkAwareData';

const ClientsPage: React.FC = () => {
  const {
    data: clients,
    isLoading,
    error,
    isFromCache,
    refresh
  } = useNetworkAwareClients();

  // Data is automatically loaded from cache first
  // Then refreshed from database when online

  return (
    <div>
      {isFromCache && (
        <div className="cache-indicator">
          Données du cache - Actualisation en cours...
        </div>
      )}

      {error && (
        <div className="error-message">
          Erreur: {error}
        </div>
      )}

      {/* Your existing UI components */}
    </div>
  );
};
```

### Example 2: Custom Network-Aware Hook
```typescript
import { useNetworkAwareData } from '../hooks/useNetworkAwareData';
import { enhancedStorageService } from '../services/enhanced-storage-service';

// Custom hook for specific data type
export const useCustomData = () => {
  return useNetworkAwareData('custom', () =>
    enhancedStorageService.getCustomData()
  );
};
```

## Enhanced Storage Service

The `EnhancedStorageService` extends the existing `StorageService` with:

- **Cache Metadata**: Tracks cache version and freshness
- **Automatic Invalidation**: Refreshes cache when marked as stale
- **Database Sync**: Fetches fresh data from API endpoints
- **Error Handling**: Graceful fallback when sync fails

### Key Methods

```typescript
import { enhancedStorageService } from '../services/enhanced-storage-service';

// Force cache refresh
await enhancedStorageService.forceRefresh();

// Get cache status
const status = enhancedStorageService.getCacheStatus();

// Ensure fresh data
await enhancedStorageService.ensureFreshData();
```

## Configuration

### API Endpoints
The system expects these API endpoints to be available:
- `GET /api/quotes` - Fetch quotes
- `GET /api/clients` - Fetch clients
- `GET /api/sites` - Fetch sites
- `GET /api/items` - Fetch supplies

### Health Check Endpoint
For connectivity testing:
- `HEAD /api/health` - Lightweight health check

## Benefits

1. **Instant Loading**: Data appears immediately from cache
2. **Offline Support**: App works without internet connection
3. **Automatic Sync**: Data stays fresh when online
4. **User Control**: Manual refresh option available
5. **Visual Feedback**: Clear status indicators
6. **Performance**: No waiting for API calls on initial load

## Migration Guide

### Step 1: Replace Direct API Calls
```typescript
// Old way
const [data, setData] = useState([]);
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// New way
const { data, isLoading, error } = useNetworkAwareData('dataType', fetcher);
```

### Step 2: Update UI Components
```typescript
// Add cache indicators
{isFromCache && <CacheIndicator />}

// Add refresh buttons
<Button onClick={refresh}>Actualiser</Button>

// Handle loading states
{isLoading && <LoadingSpinner />}
```

### Step 3: Test Offline/Online Scenarios
1. Load app with internet
2. Disconnect internet
3. Verify app works with cached data
4. Reconnect internet
5. Verify cache refreshes automatically

## Troubleshooting

### Cache Not Refreshing
- Check network connectivity
- Verify API endpoints are accessible
- Check browser console for errors
- Ensure `enhancedStorageService` is properly imported

### Data Not Loading
- Verify cache initialization
- Check localStorage permissions
- Ensure data models match expected structure

### Performance Issues
- Monitor cache size
- Check for memory leaks
- Verify background sync isn't blocking UI

## Future Enhancements

- **Conflict Resolution**: Handle data conflicts between cache and database
- **Selective Sync**: Sync only changed data
- **Background Sync**: Use Service Worker for background synchronization
- **Offline Queue**: Queue offline changes for later sync
- **Data Compression**: Compress cached data for storage efficiency
