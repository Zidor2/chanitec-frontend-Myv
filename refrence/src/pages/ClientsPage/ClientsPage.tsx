import React, { useState, useEffect } from 'react';

import logo from '../../logo.png';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Card,
  CardContent,
  InputBase,
  Collapse,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Place as PlaceIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  AcUnit as AcUnitIcon
} from '@mui/icons-material';

import { Client, Site, Split } from '../../models/Quote';
import { apiService } from '../../services/api-service';
import { generateClientId } from '../../utils/id-generator';
import CustomNumberInput from '../../components/CustomNumberInput/CustomNumberInput';
import './ClientsPage.scss';

const API_BASE_URL = process.env.REACT_APP_API_URL;

interface ClientsPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ currentPath, onNavigate }) => {
  // State for clients data
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({
    name: '',
    sites: [],
    Taux_marge: 0
  });

  // State for new site
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');

  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const [originalClientSites, setOriginalClientSites] = useState<Site[]>([]);
  const [deletedSplits, setDeletedSplits] = useState<string[]>([]);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients based on search term and site filter
  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSiteFilter !== 'all') {
      filtered = filtered.filter(client =>
        client.sites?.some(site => site.name === selectedSiteFilter)
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, selectedSiteFilter]);

  // Get unique site names for filter dropdown
  const getUniqueSiteNames = () => {
    const siteNames = new Set<string>();
    clients.forEach(client => {
      client.sites?.forEach(site => {
        siteNames.add(site.name);
      });
    });
    return Array.from(siteNames);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSiteFilter('all');
  };

  // Load all clients with their sites
  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/clients`);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const clientsData = await response.json();

      // Fetch sites for each client
      const clientsWithSites = await Promise.all(
        clientsData.map(async (client: { id: string; name: string }) => {
          const sitesResponse = await fetch(`${API_BASE_URL}/sites/by-client?clientId=${client.id}`);
          const sites = sitesResponse.ok ? await sitesResponse.json() : [];

          // Fetch splits for each site
          const sitesWithSplits = await Promise.all(
            sites.map(async (site: Site) => {
              const splitsResponse = await fetch(`${API_BASE_URL}/splits/by-site/${site.id}`);
              const splits = splitsResponse.ok ? await splitsResponse.json() : [];
              return { ...site, splits };
            })
          );

          return { ...client, sites: sitesWithSplits };
        })
      );

      setClients(clientsWithSites);
      setFilteredClients(clientsWithSites);
    } catch (error) {
      console.error('Error loading clients:', error);
      showSnackbar('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open dialog to add a new client
  const handleAddClient = () => {
    setCurrentClient({
      name: '',
      sites: [],
      Taux_marge: 0
    });
    setNewSiteName('');
    setNewSiteAddress('');
    setIsEditing(false);
    setDialogOpen(true);
  };

  // Add a new site (either locally for update, or trigger create for new client)
  const handleAddSite = async () => {
    if (!newSiteName.trim()) {
      showSnackbar('Le nom du site est requis', 'error');
      return;
    }

    const tempSite: Site = {
      id: `temp-${Date.now()}`,
      name: newSiteName.trim(),
      client_id: currentClient.id || '',
      splits: []
    };

    setCurrentClient(prev => ({
      ...prev,
      sites: [...(prev.sites || []), tempSite]
    }));
    setNewSiteName('');
  };

  // Remove a site (locally during editing)
  const handleRemoveSite = (siteIdToRemove: string) => {
    if (!isEditing && !currentClient.id) {
        setCurrentClient(prev => ({
            ...prev,
            sites: (prev.sites || []).filter(site => site.id !== siteIdToRemove)
        }));
        return;
    }

    setCurrentClient(prev => ({
      ...prev,
      sites: (prev.sites || []).filter(site => site.id !== siteIdToRemove)
    }));
  };

  // Save client (either create new or update existing)
  const handleSave = () => {
    if (isEditing) {
      handleUpdateClientAndSites();
    } else {
      handleCreateClientAndSite();
    }
  };

  // Renamed function for creating a NEW client and its first site
  const handleCreateClientAndSite = async () => {
    if (!currentClient.name?.trim()) {
      showSnackbar('Le nom du client est requis', 'error');
      return;
    }

    if (!newSiteName.trim()) {
      showSnackbar('Le nom du site est requis', 'error');
      return;
    }

    try {
      setLoading(true);

      // 1. Create client first
      const clientResponse = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentClient.name.trim(),
          Taux_marge: currentClient.Taux_marge || 0
        })
      });

      if (!clientResponse.ok) {
        throw new Error('Failed to create client');
      }

      const newClient = await clientResponse.json();

      // 2. Create the site with the new client's ID
      const siteResponse = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSiteName.trim(),
          client_id: newClient.id
        })
      });

      if (!siteResponse.ok) {
        await fetch(`${API_BASE_URL}/clients/${newClient.id}`, { method: 'DELETE' });
        throw new Error('Failed to create site');
      }

      const newSite = await siteResponse.json();

      // Create splits for this site
      const splits = (currentClient.sites?.[0]?.splits ?? []);
      await Promise.all(splits.map(split =>
        fetch(`${API_BASE_URL}/splits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: split.Code,
            name: split.name,
            description: split.description,
            puissance: split.puissance,
            site_id: newSite.id
          })
        })
      ));

      showSnackbar('Client et site créés avec succès', 'success');
      handleCloseDialog();
      await loadClients();
    } catch (error) {
      console.error('Error creating client and site:', error);
      showSnackbar('Erreur lors de la création du client et du site', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle updating an existing client and its sites
  const handleUpdateClientAndSites = async () => {
    if (!currentClient || !currentClient.id) {
      console.error('Update error: No current client ID');
      showSnackbar('Erreur: Client non identifiable pour la mise à jour', 'error');
      return;
    }

    if (!currentClient.name?.trim()) {
      showSnackbar('Le nom du client est requis', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Update Client Name
      const clientUpdateResponse = await fetch(`${API_BASE_URL}/clients/${currentClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentClient.name.trim(),
          Taux_marge: currentClient.Taux_marge || 0
        })
      });

      if (!clientUpdateResponse.ok) {
        throw new Error('Failed to update client name');
      }

      // 2. Manage Sites (Add new, Delete removed)
      const currentSites = currentClient.sites || [];
      const originalSites = originalClientSites;

      const sitesToAdd = currentSites.filter(cs => !originalSites.some(os => os.id === cs.id));
      const sitesToDelete = originalSites.filter(os => !currentSites.some(cs => cs.id === os.id));
      const sitesToUpdate = currentSites.filter(cs => originalSites.some(os => os.id === cs.id));

      // Add new sites
      const addedSitesResponses = await Promise.all(sitesToAdd.map(site =>
        fetch(`${API_BASE_URL}/sites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: site.name, client_id: currentClient.id })
        })
      ));

      // Get new site IDs for splits
      const addedSites = await Promise.all(addedSitesResponses.map(async (res, idx) => {
        if (!res.ok) throw new Error('Failed to add site');
        return await res.json();
      }));

      // Create splits for newly added sites
      await Promise.all(addedSites.map((site, idx) =>
        Promise.all((sitesToAdd[idx].splits ?? []).map(split =>
          fetch(`${API_BASE_URL}/splits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: split.Code,
              name: split.name,
              description: split.description,
              puissance: split.puissance,
              site_id: site.id
            })
          })
        ))
      ));

      // Always use POST for splits of updated sites
      await Promise.all(sitesToUpdate.map(site =>
        Promise.all((site.splits ?? []).map(split =>
          fetch(`${API_BASE_URL}/splits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: split.Code,
              name: split.name,
              description: split.description,
              puissance: split.puissance,
              site_id: site.id
            })
          })
        ))
      ));

      // Delete removed sites
      await Promise.all(sitesToDelete.map(site =>
        fetch(`${API_BASE_URL}/sites/${site.id}`, {
          method: 'DELETE'
        })
      ));

      // Delete removed splits
      await Promise.all(deletedSplits.map(code =>
        fetch(`${API_BASE_URL}/splits/${code}`, {
          method: 'DELETE'
        })
      ));

      showSnackbar('Client mis à jour avec succès', 'success');
      handleCloseDialog();
      await loadClients();
      setDeletedSplits([]);

    } catch (error) {
      console.error('Error updating client and sites:', error);
      showSnackbar('Erreur lors de la mise à jour du client', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Close dialog and reset form
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentClient({
      name: '',
      sites: [],
      Taux_marge: 0
    });
    setNewSiteName('');
    setIsEditing(false);
  };

  // Show snackbar with message
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, client: Client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setOriginalClientSites(client.sites || []);
    setIsEditing(true);
    setNewSiteName('');
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/clients/${client.id}`, {
        method: 'DELETE'
      });
      showSnackbar('Client supprimé avec succès', 'success');
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      showSnackbar('Erreur lors de la suppression du client', 'error');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  return (
    <Box className="clients-page">
        {/* Header Section */}
        <Box className="page-header">
          <Container maxWidth="lg">
            <Box className="header-content">
              <Typography variant="h4" className="page-title">
                Clients
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddClient}
                className="create-client-btn"
              >
                Créer un client
              </Button>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" className="main-content">
          {/* Filter Section */}
          <Card className="filter-card">
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'center' }}>
                <Box className="search-input">
                  <SearchIcon className="search-icon" />
                  <TextField
                    placeholder="e.g., SNEL"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    className="client-name-input"
                  />
                </Box>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedSiteFilter}
                    onChange={(e) => setSelectedSiteFilter(e.target.value)}
                    displayEmpty
                    className="site-select"
                  >
                    <MenuItem value="all">All sites</MenuItem>
                    {getUniqueSiteNames().map((siteName) => (
                      <MenuItem key={siteName} value={siteName}>
                        {siteName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Clients List */}
          <Box className="clients-list">
            {loading ? (
              <Box className="loading-state">
                <Typography>Chargement...</Typography>
              </Box>
            ) : filteredClients.length === 0 ? (
              <Box className="empty-state">
                <Typography>Aucun client trouvé</Typography>
              </Box>
            ) : (
              filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className={`client-card ${expandedClient === client.id ? 'expanded' : 'collapsed'}`}
                >
                  {/* Client Header */}
                  <Box
                    className="client-header"
                    onClick={() => toggleClientExpansion(client.id)}
                  >
                    <Box className="client-info">
                      <Typography variant="h6" className="client-name">
                        Client: {client.name}
                      </Typography>
                      <Typography variant="body2" className="margin-rate">
                        Taux de marge: {client.Taux_marge || 0}%
                      </Typography>
                    </Box>
                    <IconButton className="expand-icon">
                      {expandedClient === client.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </Box>

                  {/* Client Details */}
                  <Collapse in={expandedClient === client.id}>
                    <CardContent className="client-details">
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                        {client.sites?.map((site) => (
                          <Box key={site.id} className="site-section">
                            <Box className="site-header">
                              <BusinessIcon className="site-icon" />
                              <Typography variant="subtitle1" className="site-name">
                                Site: {site.name}
                              </Typography>
                            </Box>
                            <Box className="splits-list">
                              {site.splits && site.splits.length > 0 ? (
                                site.splits.map((split, splitIdx) => (
                                  <Box key={splitIdx} className="split-item">
                                    <Box className="split-info">
                                      <AcUnitIcon className="split-icon" />
                                      <Typography className="split-text">
                                        {split.Code || 'SPL' + (splitIdx + 1).toString().padStart(3, '0')} - {split.name || 'Split ' + (splitIdx + 1)} - {split.puissance || 0} kW
                                      </Typography>
                                    </Box>
                                    <Box className="split-actions">
                                      <IconButton size="small" className="edit-btn">
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton size="small" className="delete-btn">
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body2" className="no-splits">
                                  Aucun split configuré
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>

                      {/* Action Buttons */}
                      <Box className="client-actions">
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditClient(client)}
                          className="edit-client-btn"
                        >
                          Edit Client
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClient(client)}
                          className="delete-client-btn"
                        >
                          Delete Client
                        </Button>
                      </Box>
                    </CardContent>
                  </Collapse>
                </Card>
              ))
            )}
          </Box>
        </Container>

        {/* Add/Edit Client Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditing ? 'Modifier le client' : 'Nouveau Client'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nom du client"
              type="text"
              fullWidth
              value={currentClient.name}
              onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
            />
            <CustomNumberInput
              label="Taux de Marge"
              value={currentClient.Taux_marge || 0}
              onChange={(value) => setCurrentClient({ ...currentClient, Taux_marge: value })}
              step={0.01}
              min={0}
              fullWidth
              margin="dense"
              variant="outlined"
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Nom du site"
                size="small"
                fullWidth
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
              />
              <Button
                variant="outlined"
                onClick={handleAddSite}
                disabled={!newSiteName.trim()}
              >
                Ajouter
              </Button>
            </Box>
            <List>
              {currentClient.sites?.map((site, siteIdx) => (
                <Box key={site.id} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                  <ListItem
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveSite(site.id)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={site.name} />
                  </ListItem>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Splits</Typography>
                  {(site.splits ?? []).map((split, splitIdx) => (
                    <Box key={splitIdx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <TextField
                        label="Code split"
                        size="small"
                        value={split.Code}
                        onChange={e => {
                          const newSites = (currentClient.sites || []).map((s, idx) =>
                            idx === siteIdx
                              ? {
                                  ...s,
                                  splits: (s.splits ?? []).map((sp, spIdx) =>
                                    spIdx === splitIdx ? { ...sp, Code: e.target.value } : sp
                                  )
                                }
                              : s
                          );
                          setCurrentClient({ ...currentClient, sites: newSites });
                        }}
                      />
                      <TextField
                        label="Nom du split"
                        size="small"
                        value={split.name}
                        onChange={e => {
                          const newSites = (currentClient.sites || []).map((s, idx) =>
                            idx === siteIdx
                              ? {
                                  ...s,
                                  splits: (s.splits ?? []).map((sp, spIdx) =>
                                    spIdx === splitIdx ? { ...sp, name: e.target.value } : sp
                                  )
                                }
                              : s
                          );
                          setCurrentClient({ ...currentClient, sites: newSites });
                        }}
                      />
                      <TextField
                        label="Puissance"
                        size="small"
                        type="number"
                        value={split.puissance}
                        onChange={e => {
                          const newSites = (currentClient.sites || []).map((s, idx) =>
                            idx === siteIdx
                              ? {
                                  ...s,
                                  splits: (s.splits ?? []).map((sp, spIdx) =>
                                    spIdx === splitIdx ? { ...sp, puissance: Number(e.target.value) } : sp
                                  )
                                }
                              : s
                          );
                          setCurrentClient({ ...currentClient, sites: newSites });
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (split.Code) {
                            setDeletedSplits(prev => [...prev, split.Code]);
                          }
                          const newSites = (currentClient.sites || []).map((s, idx) =>
                            idx === siteIdx
                              ? {
                                  ...s,
                                  splits: (s.splits ?? []).filter((_, spIdx) => spIdx !== splitIdx)
                                }
                              : s
                          );
                          setCurrentClient({ ...currentClient, sites: newSites });
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      const newSplit: Split = {
                        Code: '',
                        name: '',
                        description: '',
                        puissance: 0,
                        site: site.id
                      };
                      const newSites = (currentClient.sites || []).map((s, idx) =>
                        idx === siteIdx
                          ? { ...s, splits: [...(s.splits ?? []), newSplit] }
                          : s
                      );
                      setCurrentClient({ ...currentClient, sites: newSites });
                    }}
                  >
                    Ajouter un split
                  </Button>
                </Box>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading || !currentClient.name?.trim()}
            >
              {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Enregistrer')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
};

export default ClientsPage;
