import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';

import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkCheckIcon
} from '@mui/icons-material';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { enhancedStorageService } from '../../services/enhanced-storage-service';
import { apiService } from '../../services/api-service';
import Layout from '../../components/Layout/Layout';
import './HelpPage.scss';

interface ConnectionTest {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
  timestamp?: string;
  responseTime?: number;
}

interface BackendHealth {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: string;
  error?: string;
}

interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  online: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface HelpPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  details?: string;
}

const HelpPage: React.FC<HelpPageProps> = ({ currentPath, onNavigate, onLogout }) => {
  const { isOnline, isConnecting, lastOnline, lastOffline } = useNetworkStatus();
  const [connectionTests, setConnectionTests] = useState<ConnectionTest[]>([]);
  const [backendHealth, setBackendHealth] = useState<BackendHealth[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [cacheStatus, setCacheStatus] = useState(enhancedStorageService.getCacheStatus());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');

  // Initialize system information
  useEffect(() => {
    const info: SystemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      indexedDB: !!window.indexedDB,
      serviceWorker: 'serviceWorker' in navigator,
      online: navigator.onLine,
      connectionType: (navigator as any).connection?.type,
      effectiveType: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink,
      rtt: (navigator as any).connection?.rtt
    };
    setSystemInfo(info);

    // Add initial log entry
    addLog('info', 'Page d\'aide initialisée', 'HelpPage');
  }, []);

  // Function to add logs
  const addLog = (level: LogEntry['level'], message: string, source?: string, details?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      details
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Function to clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Journaux effacés', 'HelpPage');
  };

  // Function to export logs
  const exportLogs = () => {
    const filteredLogs = logs.filter(log => logFilter === 'all' || log.level === logFilter);
    const logText = filteredLogs.map(log =>
      `[${new Date(log.timestamp).toLocaleString()}] ${log.level.toUpperCase()}: ${log.message}${log.source ? ` (${log.source})` : ''}${log.details ? ` - ${log.details}` : ''}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    addLog('info', 'Journaux exportés', 'HelpPage');
  };

  // Run all connection tests
  const runConnectionTests = async () => {
    setIsRunningTests(true);
    addLog('info', 'Démarrage des tests de connexion', 'ConnectionTests');
    const tests: ConnectionTest[] = [];

    // Test 1: Basic network connectivity
    tests.push({
      name: 'Statut Réseau',
      status: 'pending',
      message: 'Vérification de la connectivité réseau...'
    });

    // Test 2: Backend health check
    tests.push({
      name: 'Santé Backend',
      status: 'pending',
      message: 'Test de connectivité backend...'
    });

    // Test 3: Cache status
    tests.push({
      name: 'Statut Cache',
      status: 'pending',
      message: 'Vérification de la santé du cache...'
    });

    // Test 4: API endpoints
    tests.push({
      name: 'Points de Terminaison API',
      status: 'pending',
      message: 'Test de connectivité API...'
    });

    // Test 5: Storage capabilities
    tests.push({
      name: 'Capacités de Stockage',
      status: 'pending',
      message: 'Vérification de l\'accès au stockage...'
    });

    setConnectionTests(tests);

    // Run tests sequentially
    await runNetworkTest(tests, 0);
    await runBackendHealthTest(tests, 1);
    await runCacheStatusTest(tests, 2);
    await runApiEndpointsTest(tests, 3);
    await runStorageCapabilitiesTest(tests, 4);

    setIsRunningTests(false);
    addLog('info', 'Tests de connexion terminés', 'ConnectionTests');
  };

  // Test 1: Network connectivity
  const runNetworkTest = async (tests: ConnectionTest[], index: number) => {
    const startTime = Date.now();

    try {
      if (isOnline) {
        tests[index] = {
          ...tests[index],
          status: 'success',
          message: 'Le réseau est en ligne et accessible',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
      } else {
        tests[index] = {
          ...tests[index],
          status: 'error',
          message: 'Le réseau est hors ligne',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      tests[index] = {
        ...tests[index],
        status: 'error',
        message: 'Test réseau échoué',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    setConnectionTests([...tests]);
  };

  // Test 2: Backend health
  const runBackendHealthTest = async (tests: ConnectionTest[], index: number) => {
    const startTime = Date.now();

    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        tests[index] = {
          ...tests[index],
          status: 'success',
          message: `Backend en bonne santé (${response.status})`,
          responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        tests[index] = {
          ...tests[index],
          status: 'warning',
          message: `Backend a répondu avec le statut ${response.status}`,
          responseTime,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      tests[index] = {
        ...tests[index],
        status: 'error',
        message: 'Vérification de santé backend échouée',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    setConnectionTests([...tests]);
  };

  // Test 3: Cache status
  const runCacheStatusTest = async (tests: ConnectionTest[], index: number) => {
    const startTime = Date.now();

    try {
      const status = enhancedStorageService.getCacheStatus();
      const responseTime = Date.now() - startTime;

      if (status.isStale) {
        tests[index] = {
          ...tests[index],
          status: 'warning',
          message: 'Le cache est obsolète et nécessite un rafraîchissement',
          details: `Dernière mise à jour : ${status.lastUpdated}`,
          responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        tests[index] = {
          ...tests[index],
          status: 'success',
          message: 'Le cache est frais et à jour',
          details: `Dernière mise à jour : ${status.lastUpdated}`,
          responseTime,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      tests[index] = {
        ...tests[index],
        status: 'error',
        message: 'Vérification du statut du cache échouée',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    setConnectionTests([...tests]);
  };

  // Test 4: API endpoints
  const runApiEndpointsTest = async (tests: ConnectionTest[], index: number) => {
    const startTime = Date.now();

    try {
      const endpoints = ['/api/quotes', '/api/clients', '/api/items'];
      const results = await Promise.allSettled(
        endpoints.map(endpoint => fetch(endpoint, { method: 'HEAD' }))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const total = endpoints.length;
      const responseTime = Date.now() - startTime;

      if (successful === total) {
        tests[index] = {
          ...tests[index],
          status: 'success',
          message: `Tous les points de terminaison API sont accessibles (${successful}/${total})`,
          responseTime,
          timestamp: new Date().toISOString()
        };
      } else if (successful > 0) {
        tests[index] = {
          ...tests[index],
          status: 'warning',
          message: `Certains points de terminaison API sont accessibles (${successful}/${total})`,
          details: `${total - successful} points de terminaison ont échoué`,
          responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        tests[index] = {
          ...tests[index],
          status: 'error',
          message: 'Aucun point de terminaison API n\'est accessible',
          details: 'Tous les points de terminaison ont échoué',
          responseTime,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      tests[index] = {
        ...tests[index],
        status: 'error',
        message: 'Test des points de terminaison API échoué',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    setConnectionTests([...tests]);
  };

  // Test 5: Storage capabilities
  const runStorageCapabilitiesTest = async (tests: ConnectionTest[], index: number) => {
    const startTime = Date.now();

    try {
      const capabilities = {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
        cookies: navigator.cookieEnabled
      };

      const available = Object.values(capabilities).filter(Boolean).length;
      const total = Object.keys(capabilities).length;
      const responseTime = Date.now() - startTime;

      if (available === total) {
        tests[index] = {
          ...tests[index],
          status: 'success',
          message: `Toutes les capacités de stockage disponibles (${available}/${total})`,
          details: Object.entries(capabilities).map(([k, v]) => `${k}: ${v ? '✓' : '✗'}`).join(', '),
          responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        tests[index] = {
          ...tests[index],
          status: 'warning',
          message: `Certaines capacités de stockage disponibles (${available}/${total})`,
          details: Object.entries(capabilities).map(([k, v]) => `${k}: ${v ? '✓' : '✗'}`).join(', '),
          responseTime,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      tests[index] = {
        ...tests[index],
        status: 'error',
        message: 'Test des capacités de stockage échoué',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    setConnectionTests([...tests]);
  };

  // Refresh cache status
  const refreshCacheStatus = () => {
    setCacheStatus(enhancedStorageService.getCacheStatus());
  };

  // Clear all cached data
  const handleClearCache = () => {
    try {
      enhancedStorageService.clearCache();
      // Refresh the cache status after clearing
      refreshCacheStatus();
      // Show success message (you could add a toast notification here)
      alert('Cache effacé avec succès !');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Échec de l\'effacement du cache. Veuillez réessayer.');
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Layout currentPath={currentPath || '/help'} onNavigate={onNavigate} onLogout={onLogout}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Aide & Diagnostics
        </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Cette page fournit des diagnostics complets pour la connectivité réseau, la santé du backend et les capacités du système.
      </Typography>

      {/* Network Status Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Aperçu du Statut Réseau
        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <div>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  {isOnline ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />}
                  <Box>
                    <Typography variant="h6">
                      {isOnline ? 'En ligne' : 'Hors ligne'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isConnecting ? 'Connexion...' : 'Connexion stable'}
                    </Typography>
                  </Box>
                </Box>
                {lastOnline && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Dernière connexion : {new Date(lastOnline).toLocaleString()}
                  </Typography>
                )}
                {lastOffline && (
                  <Typography variant="caption" display="block">
                    Dernière déconnexion : {new Date(lastOffline).toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <StorageIcon color="primary" />
                  <Box>
                    <Typography variant="h6">Statut du Cache</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cacheStatus.isStale ? 'Nécessite un rafraîchissement' : 'À jour'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Dernière mise à jour : {cacheStatus.lastUpdated ?
                    new Date(cacheStatus.lastUpdated).toLocaleString() : 'Jamais'
                  }
                </Typography>
                <Button
                  size="small"
                  onClick={refreshCacheStatus}
                  sx={{ mt: 1 }}
                >
                  Actualiser
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={handleClearCache}
                  sx={{ ml: 1, mt: 1 }}
                >
                  Effacer Cache
                </Button>
              </CardContent>
            </Card>
          </div>
        </Box>
      </Paper>

      {/* Connection Tests */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Diagnostics de Connexion
          </Typography>
          <Button
            variant="contained"
            onClick={runConnectionTests}
            disabled={isRunningTests}
            startIcon={isRunningTests ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {isRunningTests ? 'Tests en cours...' : 'Lancer Tests'}
          </Button>
        </Box>

                {connectionTests.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {connectionTests.map((test, index) => (
               <div key={index}>
                 <Card>
                   <CardContent>
                     <Box display="flex" alignItems="center" gap={2} mb={1}>
                       {getStatusIcon(test.status)}
                       <Typography variant="h6">{test.name}</Typography>
                     </Box>
                     <Typography variant="body2" color="text.secondary" mb={1}>
                       {test.message}
                     </Typography>
                                           {test.details && (
                        <Typography variant="caption" display="block" mb={1}>
                          {test.details}
                        </Typography>
                      )}
                     {test.responseTime && (
                       <Chip
                         label={`${test.responseTime}ms`}
                         size="small"
                         color={getStatusColor(test.status) as any}
                       />
                     )}
                     {test.timestamp && (
                       <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                         {new Date(test.timestamp).toLocaleString()}
                       </Typography>
                     )}
                   </CardContent>
                 </Card>
               </div>
             ))}
           </Box>
         )}
      </Paper>

      {/* System Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informations Système
        </Typography>
                 {systemInfo && (
           <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                          <div>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                         <Typography>Navigateur & Plateforme</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem>
                        <ListItemText
                                                     primary="Agent Utilisateur"
                          secondary={systemInfo.userAgent}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                                                     primary="Plateforme"
                          secondary={systemInfo.platform}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                                                     primary="Langue"
                          secondary={systemInfo.language}
                        />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>
                                                              </div>

              <div>
               <Accordion>
                 <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>Capacités de Stockage</Typography>
                 </AccordionSummary>
                 <AccordionDetails>
                   <List dense>
                     <ListItem>
                       <ListItemIcon>
                         {systemInfo.localStorage ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                       </ListItemIcon>
                                                <ListItemText primary="Stockage Local" />
                     </ListItem>
                     <ListItem>
                       <ListItemIcon>
                         {systemInfo.sessionStorage ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                       </ListItemIcon>
                                                <ListItemText primary="Stockage de Session" />
                     </ListItem>
                     <ListItem>
                       <ListItemIcon>
                         {systemInfo.indexedDB ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                       </ListItemIcon>
                       <ListItemText primary="IndexedDB" />
                     </ListItem>
                     <ListItem>
                       <ListItemIcon>
                         {systemInfo.cookieEnabled ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                       </ListItemIcon>
                       <ListItemText primary="Cookies" />
                     </ListItem>
                   </List>
                 </AccordionDetails>
               </Accordion>
             </div>
           </Box>
         )}
      </Paper>

      {/* Network Connection Details */}
      {systemInfo && (systemInfo.connectionType || systemInfo.effectiveType) && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Détails de Connexion Réseau
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                         {systemInfo.connectionType && (
               <div >
                 <Card>
                   <CardContent>
                     <Typography variant="h6" color="primary">
                       {systemInfo.connectionType}
                     </Typography>
                     <Typography variant="body2" color="text.secondary">
                                                Type de Connexion
                     </Typography>
                   </CardContent>
                 </Card>
               </div>
             )}
             {systemInfo.effectiveType && (
               <div >
                 <Card>
                   <CardContent>
                     <Typography variant="h6" color="primary">
                       {systemInfo.effectiveType}
                     </Typography>
                     <Typography variant="body2" color="text.secondary">
                                                Type Effectif
                     </Typography>
                   </CardContent>
                 </Card>
               </div>
             )}
             {systemInfo.downlink && (
               <div >
                 <Card>
                   <CardContent>
                     <Typography variant="h6" color="primary">
                       {systemInfo.downlink} Mbps
                     </Typography>
                     <Typography variant="body2" color="text.secondary">
                                                Vitesse de Téléchargement
                     </Typography>
                   </CardContent>
                 </Card>
               </div>
             )}
             {systemInfo.rtt && (
               <div>
                 <Card>
                   <CardContent>
                     <Typography variant="h6" color="primary">
                       {systemInfo.rtt} ms
                     </Typography>
                     <Typography variant="body2" color="text.secondary">
                                                Temps d'Aller-Retour
                     </Typography>
                   </CardContent>
                 </Card>
               </div>
             )}
          </Box>
        </Paper>
      )}

      {/* Troubleshooting Tips */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Conseils de Dépannage
        </Typography>

        {/* Clear Cache Section */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
              Gestion du Cache
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Si vous rencontrez des incohérences de données ou avez besoin de rafraîchir toutes les informations mises en cache :
            </Typography>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleClearCache}
              startIcon={<StorageIcon />}
              sx={{ mb: 2 }}
            >
              Effacer Toutes les Données Cache
            </Button>
            <Typography variant="caption" display="block" color="text.secondary">
              Cela effacera toutes les données stockées localement et forcera une récupération fraîche depuis le serveur lors du prochain accès.
            </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                     <div>
             <Alert severity="info" sx={{ mb: 2 }}>
               <Typography variant="subtitle2" gutterBottom>
                 Si vous rencontrez des problèmes de connexion :
               </Typography>
               <List dense>
                 <ListItem>
                   <ListItemText primary="Vérifiez votre connexion internet" />
                 </ListItem>
                 <ListItem>
                   <ListItemText primary="Vérifiez que le serveur backend fonctionne" />
                 </ListItem>
                 <ListItem>
                   <ListItemText primary="Effacez le cache et les cookies du navigateur" />
                 </ListItem>
                 <ListItem>
                   <ListItemText primary="Essayez de rafraîchir la page" />
                 </ListItem>
               </List>
             </Alert>
                                                   </div>

           <div>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Pour l'utilisation hors ligne :
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Les données seront chargées depuis le cache" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Les modifications seront mises en file d'attente pour la synchronisation" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Reconnectez-vous pour synchroniser avec le serveur" />
                </ListItem>
              </List>
            </Alert>
          </div>
        </Box>
      </Paper>

      {/* Application Logs */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Journaux d'Application
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={clearLogs}
              color="warning"
            >
              Effacer
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={exportLogs}
              color="primary"
            >
              Exporter
            </Button>
          </Box>
        </Box>

        {/* Log Filter Controls */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Tous"
            onClick={() => setLogFilter('all')}
            color={logFilter === 'all' ? 'primary' : 'default'}
            variant={logFilter === 'all' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Info"
            onClick={() => setLogFilter('info')}
            color={logFilter === 'info' ? 'info' : 'default'}
            variant={logFilter === 'info' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Avertissement"
            onClick={() => setLogFilter('warn')}
            color={logFilter === 'warn' ? 'warning' : 'default'}
            variant={logFilter === 'warn' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Erreur"
            onClick={() => setLogFilter('error')}
            color={logFilter === 'error' ? 'error' : 'default'}
            variant={logFilter === 'error' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Debug"
            onClick={() => setLogFilter('debug')}
            color={logFilter === 'debug' ? 'default' : 'default'}
            variant={logFilter === 'debug' ? 'filled' : 'outlined'}
            size="small"
          />
        </Box>

        {/* Log Display */}
        <Box
          sx={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            bgcolor: 'background.paper',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        >
          {logs
            .filter(log => logFilter === 'all' || log.level === logFilter)
            .map((log) => (
              <Box
                key={log.id}
                sx={{
                  p: 1,
                  mb: 1,
                  borderLeft: '4px solid',
                  borderColor: log.level === 'error' ? 'error.main' :
                              log.level === 'warn' ? 'warning.main' :
                              log.level === 'info' ? 'info.main' : 'text.secondary',
                  bgcolor: log.level === 'error' ? 'error.light' :
                           log.level === 'warn' ? 'warning.light' :
                           log.level === 'info' ? 'info.light' : 'background.default',
                  borderRadius: '0 4px 4px 0'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      [{log.level.toUpperCase()}] {log.message}
                    </Typography>
                    {log.source && (
                      <Typography variant="caption" color="text.secondary">
                        Source: {log.source}
                      </Typography>
                    )}
                    {log.details && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {log.details}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          {logs.filter(log => logFilter === 'all' || log.level === logFilter).length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              Aucun journal à afficher
            </Typography>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          {logs.length} entrées de journal au total
        </Typography>
      </Paper>
    </Container>
    </Layout>
  );
};

export default HelpPage;
