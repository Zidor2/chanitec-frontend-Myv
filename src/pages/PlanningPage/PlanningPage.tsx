import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { Client, Planning } from '../../models/Quote';
import { apiService } from '../../services/api-service';
import logo512 from '../../assets/logo512.png';
import CHANitec from '../../assets/CHANitec.png';
import './PlanningPage.scss';

interface PlanningPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  clientId?: string;
}

interface PlanningSite {
  id: string;
  planning_id: string;
  site_id: string;
  planned_date?: string;
  effective_date?: string;
  status: 'planned' | 'active' | 'finished';
  is_delayed: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Split {
  id: string;
  name: string;
  site_id: string;
  [key: string]: any;
}

interface SelectedSiteWithSplits {
  planned_date?: string;
  effective_date?: string;
  status: 'planned' | 'active' | 'finished';
  is_delayed: number;
  description?: string;
  selectedSplits?: { [splitId: string]: boolean };
}

interface PlanningSiteSplitDetails {
  id?: string;
  split_id?: string;
  split_code?: string;
  split_name?: string;
  split_marque?: string;
  puissance?: string | number | null;
  freon?: string | null;
}

const PlanningPage: React.FC<PlanningPageProps> = ({
  currentPath = '/planning',
  onNavigate,
  onLogout,
  clientId
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [selectedPlanning, setSelectedPlanning] = useState<Planning | null>(null);
  const [planningSites, setPlanningSites] = useState<PlanningSite[]>([]);
  const [planningSiteSplits, setPlanningSiteSplits] = useState<{ [planningSiteId: string]: PlanningSiteSplitDetails[] }>({});
  const [loading, setLoading] = useState(true);
  const planningPdfRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSiteDialog, setOpenSiteDialog] = useState(false);
  const [openEditSiteDialog, setOpenEditSiteDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [selectedSitesForPlanning, setSelectedSitesForPlanning] = useState<{
    [siteId: string]: SelectedSiteWithSplits;
  }>({});
  const [siteSplits, setSiteSplits] = useState<{ [siteId: string]: Split[] }>({});
  const [loadingSplits, setLoadingSplits] = useState<{ [siteId: string]: boolean }>({});
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: 'planned' | 'active' | 'finished';
  }>({
    name: '',
    description: '',
    status: 'planned'
  });
  const [editSiteFormData, setEditSiteFormData] = useState<{
    planned_date?: string;
    effective_date?: string;
    status: 'planned' | 'active' | 'finished';
    is_delayed: number;
    description?: string;
  }>({
    planned_date: '',
    effective_date: '',
    status: 'planned',
    is_delayed: 0,
    description: ''
  });
  const [editingSiteSiteId, setEditingSiteSiteId] = useState<string | null>(null);
  const [editSiteSelectedSplits, setEditSiteSelectedSplits] = useState<{ [splitId: string]: boolean }>({});
  const [editSiteOriginalSplits, setEditSiteOriginalSplits] = useState<{ [splitId: string]: string }>({});
  const [loadingEditSiteSplits, setLoadingEditSiteSplits] = useState(false);
  const [savingEditedPlanningSite, setSavingEditedPlanningSite] = useState(false);

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

  // Fetch planning when client is selected via URL
  useEffect(() => {
    const fetchPlanning = async () => {
      if (!activeClientId) {
        setPlanning([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedPlanning = await apiService.getPlanningByClientId(activeClientId);
        setPlanning(fetchedPlanning);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load planning');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanning();
  }, [activeClientId]);

  // Fetch planning when client is selected via state
  useEffect(() => {
    const fetchPlanning = async () => {
      if (!selectedClient) {
        setPlanning([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedPlanning = await apiService.getPlanningByClientId(selectedClient.id);
        setPlanning(fetchedPlanning);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load planning');
      } finally {
        setLoading(false);
      }
    };

    if (!activeClientId && selectedClient) {
      fetchPlanning();
    }
  }, [selectedClient, activeClientId]);

  // Load sites for the selected client if not already present
  useEffect(() => {
    const fetchSitesForSelectedClient = async () => {
      if (!selectedClient) return;

      // If sites are already present, don't re-fetch
      if (selectedClient.sites && selectedClient.sites.length > 0) return;

      try {
        setLoading(true);
        const sites = await apiService.getSitesByClientId(selectedClient.id);
        setSelectedClient(prev => prev ? { ...prev, sites } : prev);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load client sites');
      } finally {
        setLoading(false);
      }
    };

    fetchSitesForSelectedClient();
  }, [selectedClient]);

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setLoading(true);

    // Also try to navigate if available
    if (onNavigate) {
      onNavigate(`/planning?clientId=${client.id}`);
    }
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setPlanning([]);

    // Also try to navigate back if available
    if (onNavigate) {
      onNavigate('/planning');
    }
  };

  const handleOpenDialog = (planningItem?: Planning) => {
    if (planningItem) {
      setEditingId(planningItem.id);
      setFormData({
        name: planningItem.name,
        description: planningItem.description || '',
        status: planningItem.status
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        status: 'planned'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      status: 'planned'
    });
  };

  const handleSavePlanning = async () => {
    if (!formData.name.trim()) {
      setError('Le nom du planning est requis');
      return;
    }

    try {
      if (editingId) {
        // Update existing planning
        await apiService.updatePlanning(editingId, formData);
      } else {
        // Create new planning
        const clientIdToUse = selectedClient?.id || activeClientId;
        if (!clientIdToUse) {
          setError('Client ID is required');
          return;
        }
        await apiService.createPlanning({
          client_id: clientIdToUse,
          ...formData
        });
      }

      // Refresh planning list
      const clientIdToRefresh = selectedClient?.id || activeClientId;
      if (clientIdToRefresh) {
        const fetchedPlanning = await apiService.getPlanningByClientId(clientIdToRefresh);
        setPlanning(fetchedPlanning);
      }

      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save planning');
    }
  };

  const handleDeletePlanning = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce planning ?')) {
      return;
    }

    try {
      await apiService.deletePlanning(id);

      // Refresh planning list
      const clientIdToRefresh = selectedClient?.id || activeClientId;
      if (clientIdToRefresh) {
        const fetchedPlanning = await apiService.getPlanningByClientId(clientIdToRefresh);
        setPlanning(fetchedPlanning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete planning');
    }
  };

  // Fetch planning sites when a planning is selected
  const loadPlanningSiteSplitCodes = async (planningSiteRecords: PlanningSite[]) => {
    try {
      const results = await Promise.all(planningSiteRecords.map(async (ps) => {
        try {
          const splits = await apiService.getPlanningSplitsByPlanningSiteId(ps.id);
          const details = splits.map((split: any) => ({
            id: split.id,
            split_id: split.split_id,
            split_code: split.split_code || split.Code || split.code || split.name || '',
            split_name: split.split_name || split.name || '',
            split_marque: split.split_marque || split.description || '',
            puissance: split.puissance !== undefined && split.puissance !== null && split.puissance !== '' ? split.puissance : null,
            freon: split.freon || null
          }));
          return [ps.id, details];
        } catch (err) {
          console.warn(`Failed to load splits for planning site ${ps.id}:`, err);
          return [ps.id, []];
        }
      }));

      setPlanningSiteSplits(Object.fromEntries(results));
    } catch (err) {
      console.warn('Failed to load planning site split details:', err);
      setPlanningSiteSplits({});
    }
  };

  useEffect(() => {
    const fetchPlanningSites = async () => {
      if (!selectedPlanning) {
        setPlanningSites([]);
        setPlanningSiteSplits({});
        return;
      }

      try {
        const sites = await apiService.getPlanningSitesByPlanningId(selectedPlanning.id);
        setPlanningSites(sites);
        await loadPlanningSiteSplitCodes(sites);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load planning sites');
      }
    };

    fetchPlanningSites();
  }, [selectedPlanning]);

  const handlePlanningClick = (plan: Planning) => {
    setSelectedPlanning(plan);
    setSelectedSitesForPlanning({});
  };

  const handlePrint = () => {
    if (!selectedPlanning) return;

    setIsPdfMode(true);
    window.print();

    const handleAfterPrint = () => {
      setIsPdfMode(false);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (timeoutId) clearTimeout(timeoutId);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    const timeoutId = setTimeout(() => {
      setIsPdfMode(false);
      window.removeEventListener('afterprint', handleAfterPrint);
    }, 5000);
  };

  const handleBackFromPlanningSites = () => {
    setSelectedPlanning(null);
    setPlanningSites([]);
    setSelectedSitesForPlanning({});
  };

  const handleOpenSiteDialog = () => {
    setOpenSiteDialog(true);
  };

  const handleCloseSiteDialog = () => {
    setOpenSiteDialog(false);
    setSelectedSitesForPlanning({});
  };

  const handleSiteSelection = (siteId: string, selected: boolean) => {
    if (selected) {
      setSelectedSitesForPlanning({
        ...selectedSitesForPlanning,
        [siteId]: {
          planned_date: '',
          effective_date: '',
          status: 'planned',
          is_delayed: 0,
          description: '',
          selectedSplits: {}
        }
      });

      // Fetch splits for this site if not already loaded
      if (!siteSplits[siteId] && !loadingSplits[siteId]) {
        fetchSplitsForSite(siteId);
      }
    } else {
      const newSelection = { ...selectedSitesForPlanning };
      delete newSelection[siteId];
      setSelectedSitesForPlanning(newSelection);
    }
  };

  const loadSiteSplitsOnly = async (siteId: string) => {
    if (siteSplits[siteId]) {
      return siteSplits[siteId];
    }

    try {
      setLoadingSplits(prev => ({ ...prev, [siteId]: true }));
      const splits = await apiService.getSplitsBySiteId(siteId);
      setSiteSplits(prev => ({ ...prev, [siteId]: splits }));
      return splits;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load splits for site');
      return [];
    } finally {
      setLoadingSplits(prev => ({ ...prev, [siteId]: false }));
    }
  };

  // Fetch splits for a specific site
  const fetchSplitsForSite = async (siteId: string) => {
    try {
      setLoadingSplits(prev => ({ ...prev, [siteId]: true }));
      const splits = await apiService.getSplitsBySiteId(siteId);

      setSiteSplits(prev => ({ ...prev, [siteId]: splits }));

      // Initialize all splits as selected by default (ensure we set state regardless of previous state timing)
      const defaultSelectedSplits: { [splitId: string]: boolean } = {};
      splits.forEach(split => {
        defaultSelectedSplits[split.id] = true;
      });

      setSelectedSitesForPlanning(prev => ({
        ...prev,
        [siteId]: {
          ...(prev[siteId] || { planned_date: '', effective_date: '', status: 'planned', is_delayed: 0, description: '' }),
          selectedSplits: defaultSelectedSplits
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load splits for site');
    } finally {
      setLoadingSplits(prev => ({ ...prev, [siteId]: false }));
    }
  };

  const handleSiteDataChange = (siteId: string, field: string, value: any) => {
    const siteData = {
      ...(selectedSitesForPlanning[siteId] || {}),
      [field]: value
    };

    // compute is_delayed: true if both dates present and effective_date > planned_date
    const planned = siteData.planned_date;
    const effective = siteData.effective_date;
    const isDelayed = planned && effective ? (new Date(effective) > new Date(planned)) : false;

    setSelectedSitesForPlanning({
      ...selectedSitesForPlanning,
      [siteId]: {
        ...siteData,
        is_delayed: isDelayed ? 1 : 0
      }
    });
  };

  const handleSplitToggle = (siteId: string, splitId: string, checked: boolean) => {
    setSelectedSitesForPlanning({
      ...selectedSitesForPlanning,
      [siteId]: {
        ...selectedSitesForPlanning[siteId],
        selectedSplits: {
          ...selectedSitesForPlanning[siteId].selectedSplits,
          [splitId]: checked
        }
      }
    });
  };

  const handleSavePlanningSites = async () => {
    if (!selectedPlanning) return;

    try {
      // Prepare batch payload for selected sites
      const sitesPayload = Object.keys(selectedSitesForPlanning).map(siteId => {
        const siteData = selectedSitesForPlanning[siteId];
        return {
          site_id: siteId,
          planned_date: siteData.planned_date || null,
          effective_date: siteData.effective_date || null,
          status: siteData.status || 'planned',
          is_delayed: siteData.is_delayed || 0,
          description: siteData.description || null
        };
      });

      if (sitesPayload.length > 0) {
        const createdPlanningSites = await apiService.createPlanningSitesBatch(selectedPlanning.id, sitesPayload);

        // Now create planning splits for each selected site and its selected splits
        for (const planningSite of createdPlanningSites) {
          const siteId = planningSite.site_id;
          const selectedSplitsForSite = selectedSitesForPlanning[siteId]?.selectedSplits || {};

          // Create splits array with only selected splits (use split_id key expected by API)
          const splitsToCreate = Object.keys(selectedSplitsForSite)
            .filter(splitId => selectedSplitsForSite[splitId])
            .map(splitId => ({ split_id: splitId, status: 'pending' }));

          if (splitsToCreate.length > 0) {
            await apiService.createPlanningSplitsBatch(planningSite.id, splitsToCreate);
          }
        }
      }

      // Refresh planning sites
      const sites = await apiService.getPlanningSitesByPlanningId(selectedPlanning.id);
      setPlanningSites(sites);
      await loadPlanningSiteSplitCodes(sites);

      handleCloseSiteDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save planning sites');
    }
  };

  const handleDeletePlanningSite = async (planningSiteId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce site du planning ?')) {
      return;
    }

    try {
      await apiService.deletePlanningSite(planningSiteId);

      // Refresh planning sites
      if (selectedPlanning) {
        const sites = await apiService.getPlanningSitesByPlanningId(selectedPlanning.id);
        setPlanningSites(sites);
        await loadPlanningSiteSplitCodes(sites);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete planning site');
    }
  };

  const handleOpenEditSiteDialog = async (planningSite: PlanningSite) => {
    setEditingSiteId(planningSite.id);
    setEditingSiteSiteId(planningSite.site_id);
    setEditSiteFormData({
      planned_date: planningSite.planned_date || '',
      effective_date: planningSite.effective_date || '',
      status: planningSite.status,
      is_delayed: planningSite.is_delayed,
      description: planningSite.description || ''
    });
    setEditSiteSelectedSplits({});
    setEditSiteOriginalSplits({});
    setOpenEditSiteDialog(true);
    setLoadingEditSiteSplits(true);

    try {
      const siteSplitList = await loadSiteSplitsOnly(planningSite.site_id);
      const currentPlanningSplits = await apiService.getPlanningSplitsByPlanningSiteId(planningSite.id);

      const selectedSplits: { [splitId: string]: boolean } = {};
      const originalSplits: { [splitId: string]: string } = {};

      siteSplitList.forEach((split) => {
        selectedSplits[split.id] = false;
      });

      currentPlanningSplits.forEach((split: any) => {
        if (split.split_id) {
          selectedSplits[split.split_id] = true;
          originalSplits[split.split_id] = split.id;
        }
      });

      setEditSiteSelectedSplits(selectedSplits);
      setEditSiteOriginalSplits(originalSplits);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load site splits for editing');
    } finally {
      setLoadingEditSiteSplits(false);
    }
  };

  const handleCloseEditSiteDialog = () => {
    setOpenEditSiteDialog(false);
    setEditingSiteId(null);
    setEditingSiteSiteId(null);
    setEditSiteSelectedSplits({});
    setEditSiteOriginalSplits({});
    setLoadingEditSiteSplits(false);
    setSavingEditedPlanningSite(false);
    setEditSiteFormData({
      planned_date: '',
      effective_date: '',
      status: 'planned',
      is_delayed: 0,
      description: ''
    });
  };

  const handleEditSiteSplitToggle = (splitId: string, checked: boolean) => {
    setEditSiteSelectedSplits(prev => ({
      ...prev,
      [splitId]: checked
    }));
  };

  const handleSaveEditedPlanningSite = async () => {
    if (!editingSiteId) return;

    try {
      setSavingEditedPlanningSite(true);

      await apiService.updatePlanningSite(editingSiteId, editSiteFormData);

      const splitsToAdd = Object.keys(editSiteSelectedSplits)
        .filter(splitId => editSiteSelectedSplits[splitId] && !editSiteOriginalSplits[splitId]);

      const splitsToRemove = Object.keys(editSiteOriginalSplits)
        .filter(splitId => !editSiteSelectedSplits[splitId]);

      await Promise.all(
        splitsToRemove.map(splitId => apiService.deletePlanningSplit(editSiteOriginalSplits[splitId]))
      );

      if (splitsToAdd.length > 0) {
        await apiService.createPlanningSplitsBatch(
          editingSiteId,
          splitsToAdd.map(splitId => ({ split_id: splitId, status: 'pending' }))
        );
      }

      if (selectedPlanning) {
        const sites = await apiService.getPlanningSitesByPlanningId(selectedPlanning.id);
        setPlanningSites(sites);
        await loadPlanningSiteSplitCodes(sites);
      }

      handleCloseEditSiteDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update planning site');
    } finally {
      setSavingEditedPlanningSite(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'info';
      case 'active':
        return 'warning';
      case 'finished':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planifié';
      case 'active':
        return 'Actif';
      case 'finished':
        return 'Terminé';
      default:
        return status;
    }
  };

  // (removed unused helper `groupSplitsByCharacteristics`)

  // Resolve a human-readable site name from available client/site data; fall back to the id
  const findSiteName = useCallback((siteId: string) => {
    const s1 = selectedClient?.sites?.find(s => s.id === siteId);
    if (s1 && s1.name) return s1.name;
    for (const c of clients) {
      const s = c.sites?.find(si => si.id === siteId);
      if (s && s.name) return s.name;
    }
    return siteId;
  }, [selectedClient, clients]);

  const getSiteGroupKey = (siteName: string) => {
    const normalized = siteName?.toString().trim().replace(/\s+/g, ' ');
    const match = normalized.match(/^(.*?)(?:\s+|\s*)(\d+([.,]\d+)?)\s*$/);
    return match ? (match[1].trim() || normalized) : normalized;
  };

  const formatDateForDisplay = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('fr-FR') : '-';
  };

  // Format date for HTML input (YYYY-MM-DD format)
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Ensure we handle the date in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // (removed unused helper `toRomanNumeral`)

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className="planning-page-container">
        <Box className="planning-page-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedClient && (
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
              {selectedClient ? `Planning - ${selectedClient.name}` : 'Planning'}
            </Typography>
          </Box>
          <Typography variant="body1" color="textSecondary">
            {selectedClient
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
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!loading && !error && !selectedClient && (
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

        {!loading && !error && selectedClient && !selectedPlanning && (
          <Box className="planning-details" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                Planning pour {selectedClient.name}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Créer un planning
              </Button>
            </Box>

            {planning.length === 0 ? (
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                Aucun planning disponible pour ce client.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))'
                  }
                }}
              >
                {planning.map((planningItem) => (
                  <Box key={planningItem.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-4px)'
                        }
                      }}
                      onClick={() => handlePlanningClick(planningItem)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Typography variant="h6" sx={{ flex: 1 }}>
                            {planningItem.name}
                          </Typography>
                        </Box>
                        {planningItem.description && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {planningItem.description}
                          </Typography>
                        )}
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={getStatusLabel(planningItem.status)}
                            color={getStatusColor(planningItem.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          Créé le {new Date(planningItem.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(planningItem);
                            }}
                            title="Modifier"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlanning(planningItem.id);
                            }}
                            title="Supprimer"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {!loading && !error && selectedPlanning && (
          <Box className={`planning-sites-details ${isPdfMode ? 'is-pdf-mode' : ''}`} sx={{ mt: 4 }}>
            <Box className="planning-print-hide" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBackFromPlanningSites}
                variant="outlined"
                size="small"
              >
                Retour
              </Button>
              <Box>
                <Typography variant="h5">
                  {selectedPlanning.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedPlanning.description}
                </Typography>
              </Box>
            </Box>

            <Box className="planning-print-hide" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6">
                Sites assignés ({planningSites.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  disabled={!selectedPlanning}
                >
                  Imprimer
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenSiteDialog}
                >
                  Ajouter des sites
                </Button>
              </Box>
            </Box>

            <Box
              ref={planningPdfRef}
              className={`planning-pdf-wrapper ${isPdfMode ? 'is-pdf-mode' : ''}`}
              sx={{
                width: '100%',
                p: 2,
                mx: 'auto',
                bgcolor: '#fff',
                color: '#000',
                boxSizing: 'border-box',
                overflow: 'visible',
                position: 'relative'
              }}
            >
              <img src={logo512} alt="Background Logo" className="planning-background-logo" />
              <img src={CHANitec} alt="Chanitec Logo" className="planning-background-logo-second" />
              <Box className="planning-pdf-content" sx={{ position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>
                <Box className="planning-screen-only">
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedPlanning?.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {selectedPlanning?.description}
                  </Typography>
                  {selectedClient?.name && (
                    <Typography variant="body2" color="textSecondary">
                      Client : {selectedClient.name}
                    </Typography>
                  )}
                </Box>

                {planningSites.length === 0 ? (
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                    Aucun site assigné à ce planning. Cliquez sur "Ajouter des sites" pour commencer.
                  </Typography>
                ) : (
                  <Box>
                    <Box className="planning-sheet-header">
                      <Typography variant="subtitle2" component="div" className="planning-sheet-title">
                        Client : {selectedClient?.name} / {selectedPlanning?.name}
                      </Typography>
                      <Typography variant="body2" component="div" className="planning-sheet-date">
                        {new Date().toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                    <TableContainer component={Paper} className="planning-sheet-table-container" sx={{ boxShadow: 'none', border: 'none' }}>
                      <Table className="planning-sheet-table" size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell className="cell-center"><strong>Ord</strong></TableCell>
                            <TableCell><strong>SITE</strong></TableCell>
                            <TableCell className="cell-center"><strong>NUMERO</strong></TableCell>
                            <TableCell className="cell-center"><strong>Date planifiée</strong></TableCell>
                            <TableCell><strong>Splits</strong></TableCell>
                            <TableCell className="cell-center"><strong>Date d'exécution</strong></TableCell>
                            <TableCell className="cell-center"><strong>NBR SPLIT</strong></TableCell>
                            <TableCell className="cell-center planning-print-hide"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...planningSites].sort((a, b) => findSiteName(a.site_id).localeCompare(findSiteName(b.site_id))).map((ps, index) => {
                            const splitDetails = planningSiteSplits[ps.id] || [];
                            const siteName = findSiteName(ps.site_id);
                            return (
                              <TableRow key={ps.id}>
                                <TableCell className="cell-center">{index + 1}</TableCell>
                                <TableCell>{siteName}</TableCell>
                                <TableCell className="cell-center">{index + 1}</TableCell>
                                <TableCell className="cell-center">{formatDateForDisplay(ps.planned_date)}</TableCell>
                                <TableCell>
                                  {splitDetails.length === 0 ? '-' : (
                                    <Box className="planning-split-lines">
                                      {splitDetails.map((split, splitIndex) => (
                                        <Box
                                          key={split.id || split.split_id || `${ps.id}-split-${splitIndex}`}
                                          className="planning-split-line"
                                        >
                                          <span className="planning-split-field planning-split-code">
                                            {split.split_code || '-'}
                                          </span>
                                          <span className="planning-split-field planning-split-marque">
                                            {split.split_marque || '-'}
                                          </span>
                                          <span className="planning-split-field planning-split-freon">
                                            {split.freon || '-'}
                                          </span>
                                          <span className="planning-split-field planning-split-puissance">
                                            {split.puissance ?? '-'}
                                          </span>
                                        </Box>
                                      ))}
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell className="cell-center">{formatDateForDisplay(ps.effective_date)}</TableCell>
                                <TableCell className="cell-center">{splitDetails.length}</TableCell>
                                <TableCell className="cell-center planning-print-hide">
                                  <Box className="planning-site-actions">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        aria-label="Modifier le site"
                                        onClick={() => handleOpenEditSiteDialog(ps)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        aria-label="Supprimer le site"
                                        onClick={() => handleDeletePlanningSite(ps.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            </Box>
            </Box>
          )}

        {!loading && !error && activeClientId && !selectedClient && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="textSecondary">
              Client non trouvé.
            </Typography>
          </Box>
        )}

        {!loading && !error && !selectedClient && clients.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="textSecondary">
              Aucun client trouvé.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Create/Edit Planning Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Modifier le planning' : 'Créer un nouveau planning'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nom du planning"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            placeholder="Ex: Maintenance Q1 2024"
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? 'Le nom est requis' : ''}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            placeholder="Décrivez le planning..."
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Statut</InputLabel>
            <Select
              value={formData.status}
              label="Statut"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <MenuItem value="planned">Planifié</MenuItem>
              <MenuItem value="active">Actif</MenuItem>
              <MenuItem value="finished">Terminé</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSavePlanning} variant="contained">
            {editingId ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Sites to Planning Dialog */}
      <Dialog open={openSiteDialog} onClose={handleCloseSiteDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Ajouter des sites au planning
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Sélectionnez les sites à ajouter et remplissez les dates si nécessaire.
          </Typography>

          {selectedClient?.sites && selectedClient.sites.length > 0 ? (
            <Box>
              {selectedClient.sites.sort((a, b) => (a.name || '').localeCompare((b.name || ''))).map((site) => {
                const isAlreadyAdded = planningSites.some(ps => ps.site_id === site.id);
                const isSelected = !!selectedSitesForPlanning[site.id];

                return (
                  <Box key={site.id} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleSiteSelection(site.id, e.target.checked)}
                          disabled={isAlreadyAdded}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {site.name}
                            {isAlreadyAdded && (
                              <Chip label="Déjà ajouté" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                        </Box>
                      }
                    />

                    {isSelected && !isAlreadyAdded && (
                      <Box sx={{ ml: 4, mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                          label="Date Planifiée"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={selectedSitesForPlanning[site.id]?.planned_date || ''}
                          onChange={(e) => handleSiteDataChange(site.id, 'planned_date', e.target.value)}
                          size="small"
                        />
                        <TextField
                          label="Date Effective"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={selectedSitesForPlanning[site.id]?.effective_date || ''}
                          onChange={(e) => handleSiteDataChange(site.id, 'effective_date', e.target.value)}
                          size="small"
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel>Statut</InputLabel>
                          <Select
                            value={selectedSitesForPlanning[site.id]?.status || 'planned'}
                            label="Statut"
                            onChange={(e) => handleSiteDataChange(site.id, 'status', e.target.value)}
                          >
                            <MenuItem value="planned">Planifié</MenuItem>
                            <MenuItem value="active">Actif</MenuItem>
                            <MenuItem value="finished">Terminé</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!selectedSitesForPlanning[site.id]?.is_delayed}
                              disabled
                            />
                          }
                          label="Délai"
                        />
                        <TextField
                          label="Description"
                          multiline
                          rows={2}
                          fullWidth
                          sx={{ gridColumn: '1 / -1' }}
                          value={selectedSitesForPlanning[site.id]?.description || ''}
                          onChange={(e) => handleSiteDataChange(site.id, 'description', e.target.value)}
                          size="small"
                        />

                        {/* Splits section */}
                        <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Divisions/Splits du site:
                          </Typography>

                          {loadingSplits[site.id] ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                              <CircularProgress size={20} />
                            </Box>
                          ) : siteSplits[site.id] && siteSplits[site.id].length > 0 ? (
                            <Box
                              sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                p: 1.5,
                                backgroundColor: '#fafafa',
                                maxHeight: '200px',
                                overflowY: 'auto'
                              }}
                            >
                              {siteSplits[site.id].map(split => (
                                <FormControlLabel
                                  key={split.id}
                                  control={
                                    <Checkbox
                                      checked={
                                        // if selectedSplits not initialized yet, treat as checked by default
                                        selectedSitesForPlanning[site.id]?.selectedSplits
                                          ? !!selectedSitesForPlanning[site.id]?.selectedSplits?.[split.id]
                                          : true
                                      }
                                      onChange={(e) =>
                                        handleSplitToggle(site.id, split.id, e.target.checked)
                                      }
                                    />
                                  }
                                  sx={{ display: 'block', mb: 0.5 }}
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Box sx={{ minWidth: 140 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                          {split.Code || split.code || split.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                          {split.name}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ minWidth: 120 }}>
                                        <Typography variant="caption" color="textSecondary">
                                          Puissance: {split.puissance || '-'}
                                        </Typography>
                                        {split.freon && (
                                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                            Fluide: {split.freon}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Box sx={{ flex: 1 }}>
                                        {split.description && (
                                          <Typography variant="caption" color="textSecondary">
                                            Marque: {split.description}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  }
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Aucune division disponible pour ce site.
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              Aucun site disponible pour ce client.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSiteDialog}>Annuler</Button>
          <Button onClick={handleSavePlanningSites} variant="contained" disabled={Object.keys(selectedSitesForPlanning).length === 0}>
            Ajouter les sites
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Planning Site Dialog - Fully Enhanced */}
      <Dialog open={openEditSiteDialog} onClose={handleCloseEditSiteDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon />
            <Box>
              <Typography variant="h6" sx={{ color: 'white', m: 0 }}>
                Modifier le site du planning
              </Typography>
              {editingSiteSiteId && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {findSiteName(editingSiteSiteId)}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip
            label={getStatusLabel(editSiteFormData.status)}
            color={getStatusColor(editSiteFormData.status) as any}
            sx={{ fontWeight: 600 }}
          />
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {/* Left Column - Dates and Status */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                📅 Planification
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Date Planifiée"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formatDateForInput(editSiteFormData.planned_date) || ''}
                  onChange={(e) => {
                    const newData = { ...editSiteFormData, planned_date: e.target.value };
                    const planned = newData.planned_date;
                    const effective = newData.effective_date;
                    const isDelayed = planned && effective ? (new Date(effective) > new Date(planned)) : false;
                    setEditSiteFormData({ ...newData, is_delayed: isDelayed ? 1 : 0 });
                  }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Date d'Exécution"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formatDateForInput(editSiteFormData.effective_date) || ''}
                  onChange={(e) => {
                    const newData = { ...editSiteFormData, effective_date: e.target.value };
                    const planned = newData.planned_date;
                    const effective = newData.effective_date;
                    const isDelayed = planned && effective ? (new Date(effective) > new Date(planned)) : false;
                    setEditSiteFormData({ ...newData, is_delayed: isDelayed ? 1 : 0 });
                  }}
                  size="small"
                  helperText={editSiteFormData.is_delayed ? "⚠️ Délai détecté" : ""}
                  error={!!editSiteFormData.is_delayed}
                />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                  ⚙️ Statut
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut du site</InputLabel>
                  <Select
                    value={editSiteFormData.status}
                    label="Statut du site"
                    onChange={(e) => setEditSiteFormData({ ...editSiteFormData, status: e.target.value as any })}
                  >
                    <MenuItem value="planned">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196F3' }} />
                        Planifié
                      </Box>
                    </MenuItem>
                    <MenuItem value="active">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFC107' }} />
                        Actif
                      </Box>
                    </MenuItem>
                    <MenuItem value="finished">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                        Terminé
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mt: 2, p: 1.5, bgcolor: editSiteFormData.is_delayed ? '#FFEBEE' : '#E8F5E9', borderRadius: 1, border: '1px solid', borderColor: editSiteFormData.is_delayed ? '#FFCDD2' : '#C8E6C9' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!editSiteFormData.is_delayed}
                        disabled
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Délai détecté
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          La date d'exécution est après la date planifiée
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>
            </Box>

            {/* Right Column - Description and Notes */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                📝 Détails
              </Typography>
              <TextField
                fullWidth
                label="Description / Notes"
                multiline
                rows={8}
                value={editSiteFormData.description || ''}
                onChange={(e) => setEditSiteFormData({ ...editSiteFormData, description: e.target.value })}
                placeholder="Ajoutez des notes, observations ou détails spécifiques pour ce site..."
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>

          {/* Splits Section - Full Width */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                🔧 Divisions / Splits du site
              </Typography>
              {editingSiteSiteId && siteSplits[editingSiteSiteId]?.length > 0 && (
                <Chip
                  label={`${Object.values(editSiteSelectedSplits).filter(Boolean).length} sélectionnés / ${siteSplits[editingSiteSiteId].length} disponibles`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            {loadingEditSiteSplits || (editingSiteSiteId && loadingSplits[editingSiteSiteId]) ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : editingSiteSiteId && siteSplits[editingSiteSiteId]?.length > 0 ? (
              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 700, width: '50px' }}>Sélection</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Marque</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Puissance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fluide</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {siteSplits[editingSiteSiteId].map((split, idx) => {
                      const isSelected = !!editSiteSelectedSplits[split.id];
                      return (
                        <TableRow
                          key={split.id}
                          sx={{
                            bgcolor: isSelected ? '#E3F2FD' : 'white',
                            '&:hover': { bgcolor: isSelected ? '#BBDEFB' : '#fafafa' },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => handleEditSiteSplitToggle(split.id, e.target.checked)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {split.Code || split.code || split.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {split.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {split.name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={split.puissance || '-'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={split.freon || '-'}
                              size="small"
                              color={split.freon ? 'primary' : 'default'}
                              variant={split.freon ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 1, border: '1px dashed #ccc' }}>
                <Typography variant="body2" color="textSecondary">
                  ❌ Aucune division disponible pour ce site.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCloseEditSiteDialog} disabled={savingEditedPlanningSite} variant="outlined">
            Annuler
          </Button>
          <Button
            onClick={handleSaveEditedPlanningSite}
            variant="contained"
            disabled={savingEditedPlanningSite || loadingEditSiteSplits}
            sx={{ minWidth: 120 }}
          >
            {savingEditedPlanningSite ? '⏳ Enregistrement...' : '✓ Mettre à jour'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default PlanningPage;
