import React, { useEffect, useState } from 'react';
import { Box, Paper, TextField, Typography, MenuItem, Tooltip, CircularProgress } from '@mui/material';
import { Client, Site } from '../../models/Quote';
import { apiService } from '../../services/api-service';
import { extractVersion } from '../../utils/id-generator';
import './QuoteHeader.scss';
import CustomNumberInput from '../CustomNumberInput/CustomNumberInput';

interface QuoteHeaderProps {
  quoteId: string;
  clientName: string;
  siteName: string;
  object: string;
  date: string;
  onClientChange: (value: string) => void;
  onSiteChange: (value: string) => void;
  onObjectChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onClientMarginChange?: (margin: number) => void;
}

const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  quoteId,
  clientName,
  siteName,
  object,
  date,
  onClientChange,
  onSiteChange,
  onObjectChange,
  onDateChange,
  onClientMarginChange
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSitesLoading, setIsSitesLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [clientMargin, setClientMargin] = useState<number | null>(null);

  // Format quoteId to display version information
  const formatQuoteId = (id: string) => {
    const match = id.match(/^(F-\d{8})-(\d{3})$/);

    if (match) {
      const [_, baseId, version] = match;
      const versionNum = parseInt(version, 10);

      if (versionNum === 0) {
        return id;
      } else {
        return (
          <>
            {baseId}-<span className="version-number">{version}</span>
          </>
        );
      }
    }

    return id;
  };

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const loadedClients = await apiService.getClients();
        console.log('Loaded clients:', loadedClients);
        setClients(loadedClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  // Load sites whenever clientName changes - separate from the client loading effect
  useEffect(() => {
    const loadSitesForClient = async () => {
      if (!clientName) {
        console.log('No client selected, clearing sites');
        setSites([]);
        setSelectedClientId(null);
        setSiteError(null);
        return;
      }

      try {
        setSiteError(null);
        setIsSitesLoading(true);

        const selectedClient = clients.find(c => c.name === clientName);
        console.log('Selected client:', selectedClient);

        if (!selectedClient) {
          console.log('No matching client found, clearing sites');
          setSites([]);
          setSelectedClientId(null);
          return;
        }

        setSelectedClientId(selectedClient.id);

        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const sitesUrl = `${API_BASE_URL}/sites/by-client?clientId=${selectedClient.id}`;
        console.log('Sending request to:', sitesUrl);

        const sitesResponse = await fetch(sitesUrl);

        if (!sitesResponse.ok) {
          console.error('Error response from API:', sitesResponse.status, sitesResponse.statusText);
          throw new Error(`Failed to fetch sites: ${sitesResponse.statusText}`);
        }

        const clientSites = await sitesResponse.json();
        console.log(`Sites for client ${selectedClient.id}:`, clientSites);

        if (Array.isArray(clientSites) && clientSites.length === 0) {
          console.log('No sites found for this client');
        }

        setSites(clientSites);

      } catch (error) {
        console.error('Error loading sites for client:', error);
        setSiteError('Failed to load sites for this client');
        setSites([]);
      } finally {
        setIsSitesLoading(false);
      }
    };

    loadSitesForClient();
  }, [clientName, clients]);

  useEffect(() => {
    if (!clientName || clients.length === 0) return;
    // Use case-insensitive, trimmed match for robustness
    const selectedClient = clients.find(
      c => c.name.trim().toLowerCase() === clientName.trim().toLowerCase()
    );
    if (selectedClient && selectedClient.Taux_marge != null) {
      const margin = Number(selectedClient.Taux_marge);
      if (!isNaN(margin)) {
        setClientMargin(margin);
        // Don't automatically set margin rates - let user control them manually
        // if (onClientMarginChange) onClientMarginChange(margin);
      }
    }
  }, [clientName, clients]);

  // Handle client selection change - with safeguards for debugging
  const handleClientChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = event.target.value;
      // Find the selected client
      const selectedClient = clients.find(c => c.name === value);
      // Call the parent to update the client name
      onClientChange(value);
      // If the client has a Taux_marge, update local state but don't automatically set margin rates
      if (selectedClient && selectedClient.Taux_marge != null) {
        const margin = Number(selectedClient.Taux_marge);
        if (!isNaN(margin)) {
          setClientMargin(margin);
          // Don't automatically set margin rates - let user control them manually
          // if (onClientMarginChange) onClientMarginChange(margin);
        }
      }
      // Clear site when client changes
      onSiteChange('');
    } catch (error) {
      console.error('Error in client selection handler:', error);
    }
  };



  const version = extractVersion(quoteId);
  const isRevision = version !== null && version > 0;

  return (
    <Paper className="quote-header" elevation={2}>
      <Box className="quote-id-display">
        <Typography variant="subtitle1" className="id-label">
          Devis:
        </Typography>
        <Tooltip title={isRevision ? `Version ${version} du devis` : "Version originale"}>
          <Typography variant="subtitle1" className={`id-value ${isRevision ? 'is-revision' : ''}`}>
            {formatQuoteId(quoteId)}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }} className="info-grid">
        {/* Client selection dropdown - simplified for reliability */}
        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            select
            fullWidth
            label="CLIENT"
            value={clientName}
            onChange={handleClientChange}
            variant="outlined"
            margin="normal"
            className="header-field"
          >
            <MenuItem value="">Sélectionnez un client</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.name}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>
          {isLoading && <Typography variant="caption" color="text.secondary">Chargement des clients...</Typography>}
        </Box>


        <Box sx={{ flex: '1 1 220px', position: 'relative' }}>
          <TextField
            select
            fullWidth
            label="SITE"
            value={siteName}
            onChange={(e) => {
              console.log('Site changed to:', e.target.value);
              onSiteChange(e.target.value);
            }}
            variant="outlined"
            margin="normal"
            className="header-field"
            disabled={!clientName || isSitesLoading}
            error={!!siteError}
            helperText={siteError}
          >
            <MenuItem value="">Sélectionnez un site</MenuItem>
            {sites.map((site) => (
              <MenuItem key={site.id} value={site.name}>
                {site.name}
              </MenuItem>
            ))}
          </TextField>
          {isSitesLoading && (
            <CircularProgress
              size={24}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                marginTop: -12
              }}
            />
          )}
          {sites.length === 0 && clientName && !isSitesLoading && (
            <Typography variant="caption" color="text.secondary">
              Aucun site disponible pour ce client
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            fullWidth
            label="OBJET"
            value={object}
            onChange={(e) => onObjectChange(e.target.value)}
            variant="outlined"
            margin="normal"
            className="header-field"
            placeholder="Objet de l'intervention"
          />
        </Box>

        <Box sx={{ flex: '1 1 220px' }}>
          <TextField
            fullWidth
            label="DATE"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            variant="outlined"
            margin="normal"
            className="header-field"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default QuoteHeader;

