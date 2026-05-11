import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { Business as BusinessIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { Client } from '../../models/Quote';
import { apiService } from '../../services/api-service';
import './PlanningPage.scss';

interface PlanningPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  clientId?: string;
}

const PlanningPage: React.FC<PlanningPageProps> = ({
  currentPath = '/planning',
  onNavigate,
  onLogout,
  clientId
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get clientId from URL params if not provided as prop
  const urlParams = new URLSearchParams(window.location.search);
  const urlClientId = urlParams.get('clientId');
  const activeClientId = clientId || urlClientId;

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedClients = await apiService.getClients();
        setClients(fetchedClients);

        // If clientId is provided, find and set the selected client
        if (activeClientId) {
          const client = fetchedClients.find(c => c.id === activeClientId);
          if (client) {
            setSelectedClient(client);
          } else {
            setError('Client not found');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [activeClientId]);

  const handleClientClick = (client: Client) => {
    if (onNavigate) {
      onNavigate(`/planning?clientId=${client.id}`);
    }
  };

  const handleBackToClients = () => {
    if (onNavigate) {
      onNavigate('/planning');
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className="planning-page-container">
        <Box className="planning-page-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {activeClientId && (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBackToClients}
                variant="outlined"
                size="small"
              >
                Retour
              </Button>
            )}
            <Typography variant="h4" component="h1" gutterBottom>
              {activeClientId ? `Planning - ${selectedClient?.name || 'Client'}` : 'Planning'}
            </Typography>
          </Box>
          <Typography variant="body1" color="textSecondary">
            {activeClientId
              ? 'Gérez le planning et les interventions pour ce client.'
              : 'Gérez vos plannings, interventions et ressources depuis cette page.'
            }
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !activeClientId && (
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))'
              }
            }}
          >
            {clients.map((client) => (
              <Card
                key={client.id}
                className="client-card"
                sx={{ minHeight: 140, cursor: 'pointer' }}
                onClick={() => handleClientClick(client)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      {client.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {client.sites?.length || 0} site{client.sites?.length !== 1 ? 's' : ''}
                  </Typography>
                  {client.Taux_marge && (
                    <Typography variant="body2" color="textSecondary">
                      Taux marge: {client.Taux_marge}%
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {!loading && !error && activeClientId && selectedClient && (
          <Box className="planning-details" sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Planning pour {selectedClient.name}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
              Aucun planning disponible pour ce client.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.alert('La création de planning n\'est pas encore disponible.')}
            >
              Créer un planning
            </Button>
          </Box>
        )}

        {!loading && !error && activeClientId && !selectedClient && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="textSecondary">
              Client non trouvé.
            </Typography>
          </Box>
        )}

        {!loading && !error && !activeClientId && clients.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="textSecondary">
              Aucun client trouvé.
            </Typography>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default PlanningPage;
