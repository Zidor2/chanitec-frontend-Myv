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
  InputAdornment,
  Grid
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
import Layout from '../../components/Layout/Layout';
import { Client, Site, Split } from '../../models/Quote'; // <-- Import Split here
import { apiService } from '../../services/api-service';
import { generateClientId } from '../../utils/id-generator';
import CustomNumberInput from '../../components/CustomNumberInput/CustomNumberInput';
import './ClientsPage.scss';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface ClientsPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}


const ClientsPage: React.FC<ClientsPageProps> = ({ currentPath, onNavigate, onLogout }) => {
  // State for clients data
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState('all');
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

  const [originalClientSites, setOriginalClientSites] = useState<Site[]>([]); // Store original sites when editing
  const [deletedSplits, setDeletedSplits] = useState<string[]>([]); // Track split codes to delete
  const [puissanceInputs, setPuissanceInputs] = useState<{[key: string]: string}>({}); // Store raw input values for puissance fields

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients when search term changes
  useEffect(() => {
    filterClients();
  }, [searchTerm, selectedSite, clients]);

  // Filter clients based on search term and site filter
  const filterClients = () => {
    let filtered = [...clients];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Site filter
    if (selectedSite !== 'all') {
      filtered = filtered.filter(client =>
        client.sites?.some(site => site.id === selectedSite)
      );
    }

    setFilteredClients(filtered);
  };

  // Get all unique sites for the dropdown
  const getAllSites = () => {
    const allSites: { id: string; name: string }[] = [];
    clients.forEach(client => {
      client.sites?.forEach(site => {
        if (!allSites.find(s => s.id === site.id)) {
          allSites.push({ id: site.id, name: site.name });
        }
      });
    });
    return allSites;
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSite('all');
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
      id: `temp-${Date.now()}`, // Temporary ID for local state
      name: newSiteName.trim(),
      client_id: currentClient.id || '', // Ensure client_id is present
      splits: [] // <-- Initialize splits
    };

    setCurrentClient(prev => ({
      ...prev,
      sites: [...(prev.sites || []), tempSite]
    }));
    setNewSiteName(''); // Clear input
  };

  // Remove a site (locally during editing)
  const handleRemoveSite = (siteIdToRemove: string) => {
    if (!isEditing && !currentClient.id) {
        // If creating a new client, just remove locally
        setCurrentClient(prev => ({
            ...prev,
            sites: (prev.sites || []).filter(site => site.id !== siteIdToRemove)
        }));
        return;
    }

    // If editing an existing client, also remove locally
    setCurrentClient(prev => ({
      ...prev,
      sites: (prev.sites || []).filter(site => site.id !== siteIdToRemove)
    }));
    // Note: The actual deletion API call happens in handleUpdateClientAndSites
  };

  // Save client (either create new or update existing)
  const handleSave = () => {
    if (isEditing) {
      handleUpdateClientAndSites();
    } else {
      handleCreateClientAndSite(); // Renamed the original save function
    }
  };

  // Renamed function for creating a NEW client and its first site
  const handleCreateClientAndSite = async () => {
    if (!currentClient.name?.trim()) {
      showSnackbar('Le nom du client est requis', 'error');
      return;
    }

    // Check if we have sites added or if we need to use the newSiteName
    const hasSites = (currentClient.sites?.length || 0) > 0;
    const siteNameToUse = hasSites ? currentClient.sites![0].name : newSiteName.trim();

    if (!siteNameToUse) {
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
          name: siteNameToUse,
          client_id: newClient.id
        })
      });

      if (!siteResponse.ok) {
        await fetch(`${API_BASE_URL}/clients/${newClient.id}`, { method: 'DELETE' });
        throw new Error('Failed to create site');
      }

      // After site creation:
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
            site_id: newSite.id // <-- use site_id, not site
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
      setDeletedSplits([]); // Reset after update

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
    setPuissanceInputs({}); // Clear puissance inputs
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
    setCurrentClient(client); // Load current data
    setOriginalClientSites(client.sites || []); // Store original sites for comparison
    setIsEditing(true);
    setNewSiteName(''); // Clear new site name field
    setDialogOpen(true);
    setPuissanceInputs({}); // Clear puissance inputs when editing starts
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

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className="clients-page">
        {/* Header Section */}
        <Box className="page-header">
          <Container maxWidth="lg">
            <Box className="header-content">
              <Box className="header-left">
                <Typography variant="h4" className="page-title">
                  Clients
                </Typography>
              </Box>
              <Box className="header-actions">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddClient}
                  disabled={loading}
                  className="create-client-btn"
                >
                  + Create Client
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" className="main-content">
          {/* Filter Section */}
          <Box className="filter-section">
            <Box className="filter-content">
              <Box className="filter-left">
                <TextField
                  label="Client Name"
                  placeholder="e.g., SNEL"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="outlined"
                  size="small"
                  className="client-name-input"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  label="Site"
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  variant="outlined"
                  size="small"
                  className="site-filter"
                >
                  <MenuItem value="all">All sites</MenuItem>
                  {getAllSites().map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                Clear Filters
              </Button>
            </Box>
          </Box>

          {/* Clients Cards Section */}
          <Box className="clients-cards-section">
            {loading ? (
              <Box className="loading-container">
                <Typography>Chargement...</Typography>
              </Box>
            ) : filteredClients.length === 0 ? (
              <Box className="empty-container">
                <Typography>Aucun client trouvé</Typography>
              </Box>
            ) : (
              filteredClients.map((client) => (
                <Box key={client.id} className="client-card">
                  {/* Client Header */}
                  <Box
                    className={`client-header ${expandedClient === client.id ? 'expanded' : 'collapsed'}`}
                    onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                  >
                    <Box className="client-header-left">
                      <Typography className="client-title">
                        Client: {client.name} ({client.sites?.length || 0} sites)
                      </Typography>
                    </Box>
                    <Box className="client-header-right">
                      <Typography className="margin-rate">
                        Taux de marge: {client.Taux_marge || 0}%
                      </Typography>
                      <IconButton className="expand-icon">
                        {expandedClient === client.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Client Content */}
                  <Collapse in={expandedClient === client.id}>
                    <Box className="client-content">
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        {client.sites?.map((site) => (
                          <Box key={site.id}>
                            <Card className="site-card">
                              <CardContent>
                                <Box className="site-header">
                                  <BusinessIcon className="site-icon" />
                                  <Typography className="site-title">
                                    Site: {site.name}
                                  </Typography>
                                </Box>

                                                                 <Box className="splits-section">
                                   {site.splits && site.splits.length > 0 ? (
                                     site.splits.map((split, splitIdx) => (
                                       <Box key={splitIdx} className="split-item">
                                         <Box className="split-info">
                                           <AcUnitIcon className="split-icon" />
                                           <Typography className="split-text">
                                             {split.Code || 'N/A'} - {split.name || 'N/A'} - {split.puissance || 0} BTU/KW
                                           </Typography>
                                         </Box>
                                       </Box>
                                     ))
                                   ) : (
                                     <Typography className="no-splits">
                                       Aucun équipement frigorifique
                                     </Typography>
                                   )}
                                 </Box>
                               </CardContent>
                             </Card>
                           </Box>
                         ))}
                       </Box>

                      {/* Client Actions */}
                      <Box className="client-actions">
                        <Button
                          variant="outlined"
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
                    </Box>
                  </Collapse>
                </Box>
              ))
            )}
          </Box>
        </Container>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedClient?.sites?.map((site) => (
          <MenuItem key={site.id} disabled>
            <ListItemText primary={site.name} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => selectedClient && handleEditClient(selectedClient)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedClient && handleDeleteClient(selectedClient)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Client Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
          {/* Show site name field if no sites have been added yet, or if user wants to add another site */}
          {(currentClient.sites?.length || 0) === 0 && (
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
          )}

          {/* Show option to add another site if sites already exist */}
          {(currentClient.sites?.length || 0) > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Nom du site (optionnel)"
                size="small"
                fullWidth
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="Ajouter un autre site..."
              />
              <Button
                variant="outlined"
                onClick={handleAddSite}
                disabled={!newSiteName.trim()}
              >
                Ajouter un site
              </Button>
            </Box>
          )}
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
                {/* Splits for this site */}
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Équipement frigorifique</Typography>
                {(site.splits ?? []).map((split, splitIdx) => (
                  <Box key={splitIdx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <TextField
                      label="Code"
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
                      select
                      label="Type"
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
                      sx={{ minWidth: 200 }}
                    >
                      <MenuItem value="Split">Split</MenuItem>
                      <MenuItem value="Ventilo-convecteur">Ventilo-convecteur</MenuItem>
                      <MenuItem value="Injecto">Injecto</MenuItem>
                      <MenuItem value="K7 détente direct">K7 détente direct</MenuItem>
                      <MenuItem value="K7 à eau">K7 à eau</MenuItem>
                      <MenuItem value="GF">GF</MenuItem>
                      <MenuItem value="Mini centrale">Mini centrale</MenuItem>
                      <MenuItem value="Armoire de clim">Armoire de clim</MenuItem>
                      <MenuItem value="GP">GP</MenuItem>
                      <MenuItem value="ROOFTOP">ROOFTOP</MenuItem>
                      <MenuItem value="Split Gainable">Split Gainable</MenuItem>
                    </TextField>
                    <TextField
                      label="Marque"
                      size="small"
                      value={split.description}
                      onChange={e => {
                        const newSites = (currentClient.sites || []).map((s, idx) =>
                          idx === siteIdx
                            ? {
                                ...s,
                                splits: (s.splits ?? []).map((sp, spIdx) =>
                                  spIdx === splitIdx ? { ...sp, description: e.target.value } : sp
                                )
                              }
                            : s
                        );
                        setCurrentClient({ ...currentClient, sites: newSites });
                      }}
                      sx={{ minWidth: 200 }}
                    />
                                        <TextField

                      label="Puissance en BTU/Kw "
                      size="small"
                      value={puissanceInputs[`${site.id}-${splitIdx}`] ?? (split.puissance || '')}
                      onChange={e => {
                        const value = e.target.value;
                        const inputKey = `${site.id}-${splitIdx}`;

                        // Update the raw input state
                        setPuissanceInputs(prev => ({
                          ...prev,
                          [inputKey]: value
                        }));

                        // Only update the actual split data if it's a valid number
                        if (value === '' || !isNaN(parseFloat(value))) {
                          const newSites = (currentClient.sites || []).map((s, idx) =>
                            idx === siteIdx
                              ? {
                                  ...s,
                                  splits: (s.splits ?? []).map((sp, spIdx) =>
                                    spIdx === splitIdx ? { ...sp, puissance: value === '' ? 0 : parseFloat(value) || 0 } : sp
                                  )
                                }
                              : s
                          );
                          setCurrentClient({ ...currentClient, sites: newSites });
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const inputKey = `${site.id}-${splitIdx}`;

                        // On blur, ensure we have a valid number
                        if (value === '' || isNaN(parseFloat(value))) {
                          setPuissanceInputs(prev => ({
                            ...prev,
                            [inputKey]: String(split.puissance || '')
                          }));
                        }
                      }}
                      sx={{ minWidth: 180 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        // If split has a Code, mark for deletion
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
                {/* Add Split Button */}
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    const newSplit: Split = {
                      Code: '',           // or generate a code if needed
                      name: '',
                      description: '',
                      puissance: 0,
                      site: site.id       // associate with the current site
                    };
                    const newSites = (currentClient.sites || []).map((s, idx) =>
                      idx === siteIdx
                        ? { ...s, splits: [...(s.splits ?? []), newSplit] }
                        : s
                    );
                    setCurrentClient({ ...currentClient, sites: newSites });
                  }}
                >
                  Ajouter un équipement
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
    </Layout>
  );
};

export default ClientsPage;
