import React, { useState, useEffect, useRef } from 'react';
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
  Download as DownloadIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { Client, Planning } from '../../models/Quote';
import { apiService } from '../../services/api-service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [planningSiteSplitCodes, setPlanningSiteSplitCodes] = useState<{ [planningSiteId: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const planningPdfRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSiteDialog, setOpenSiteDialog] = useState(false);
  const [openEditSiteDialog, setOpenEditSiteDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
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
          const codes = splits
            .map((split: any) => {
              const label = (split.split_code || split.Code || split.code || split.name) || '';
              const puissance = (split.puissance !== undefined && split.puissance !== null && split.puissance !== '') ? String(split.puissance) : null;
              const freon = split.freon || null;
              const details = [] as string[];
              if (puissance) details.push(`${puissance}`);
              if (freon) details.push(`${freon}`);
              return details.length > 0 ? `${label} (${details.join(' · ')})` : label;
            })
            .filter(Boolean);
          return [ps.id, codes];
        } catch (err) {
          console.warn(`Failed to load splits for planning site ${ps.id}:`, err);
          return [ps.id, []];
        }
      }));

      setPlanningSiteSplitCodes(Object.fromEntries(results));
    } catch (err) {
      console.warn('Failed to load planning site split codes:', err);
      setPlanningSiteSplitCodes({});
    }
  };

  useEffect(() => {
    const fetchPlanningSites = async () => {
      if (!selectedPlanning) {
        setPlanningSites([]);
        setPlanningSiteSplitCodes({});
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

  const handleDownloadPlanningPdf = async () => {
    if (!planningPdfRef.current || !selectedPlanning) return;

    try {
      setExportingPdf(true);
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(planningPdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: planningPdfRef.current.scrollWidth,
        height: planningPdfRef.current.scrollHeight,
        windowWidth: planningPdfRef.current.scrollWidth,
        windowHeight: planningPdfRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const xOffset = margin + (availableWidth - finalWidth) / 2;
      const yOffset = margin + (availableHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      const fileName = `${selectedPlanning.name?.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'planning'}_export.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating planning PDF:', error);
      setError('Impossible de générer le PDF. Veuillez réessayer.');
    } finally {
      setExportingPdf(false);
    }
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

  const handleOpenEditSiteDialog = (planningSite: PlanningSite) => {
    setEditingSiteId(planningSite.id);
    setEditSiteFormData({
      planned_date: planningSite.planned_date || '',
      effective_date: planningSite.effective_date || '',
      status: planningSite.status,
      is_delayed: planningSite.is_delayed,
      description: planningSite.description || ''
    });
    setOpenEditSiteDialog(true);
  };

  const handleCloseEditSiteDialog = () => {
    setOpenEditSiteDialog(false);
    setEditingSiteId(null);
    setEditSiteFormData({
      planned_date: '',
      effective_date: '',
      status: 'planned',
      is_delayed: 0,
      description: ''
    });
  };

  const handleSaveEditedPlanningSite = async () => {
    if (!editingSiteId) return;

    try {
      await apiService.updatePlanningSite(editingSiteId, editSiteFormData);

      // Refresh planning sites
      if (selectedPlanning) {
        const sites = await apiService.getPlanningSitesByPlanningId(selectedPlanning.id);
        setPlanningSites(sites);
        await loadPlanningSiteSplitCodes(sites);
      }

      handleCloseEditSiteDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update planning site');
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
          <Box className="planning-sites-details" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6">
                Sites assignés ({planningSites.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadPlanningPdf}
                  disabled={!selectedPlanning}
                >
                  Télécharger PDF
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
              sx={{
                width: exportingPdf ? '210mm' : '100%',
                minHeight: exportingPdf ? '297mm' : 'auto',
                maxWidth: exportingPdf ? '210mm' : '100%',
                p: 2,
                mx: 'auto',
                bgcolor: '#fff',
                color: '#000',
                boxSizing: 'border-box',
                overflow: 'visible'
              }}
            >
              <Box sx={{ mb: 2, pb: 1 }}>
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
              <TableContainer component={Paper} sx={{ width: '100%', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.12)' }}>
                <Table sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700, width: 60 }}>N°</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}>Site</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}>Date Planifiée</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}>Date Effective</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}>Statut</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}>Délai</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}>Splits (Puissance · Fluide)</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}>Description</TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', fontWeight: 700, display: exportingPdf ? 'none' : 'table-cell' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {planningSites.map((ps, index) => {
                      const site = selectedClient?.sites?.find(s => s.id === ps.site_id);
                      return (
                        <TableRow key={ps.id} sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                          <TableCell sx={{ fontWeight: 500, p: '8px 16px' }}>{index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 500, p: '8px 16px' }}>{site?.name || ps.site_id}</TableCell>
                          <TableCell sx={{ p: '8px 16px' }}>
                            {ps.planned_date ? new Date(ps.planned_date).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell sx={{ p: '8px 16px' }}>
                            {ps.effective_date ? new Date(ps.effective_date).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell sx={{ p: '8px 16px' }}>
                            {getStatusLabel(ps.status)}
                          </TableCell>
                          <TableCell sx={{ p: '8px 16px' }}>
                            {ps.is_delayed ? 'Oui' : 'Non'}
                          </TableCell>
                          <TableCell sx={{ p: '8px 16px' }}>
                            {planningSiteSplitCodes[ps.id] && planningSiteSplitCodes[ps.id].length > 0 ? planningSiteSplitCodes[ps.id].join(', ') : '-'}
                          </TableCell>
                          <TableCell sx={{ p: '8px 16px' }}>{ps.description || '-'}</TableCell>
                          <TableCell align="right" sx={{ p: '8px 16px', display: exportingPdf ? 'none' : 'table-cell' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditSiteDialog(ps)}
                              title="Modifier"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePlanningSite(ps.id)}
                              title="Supprimer"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
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
              {selectedClient.sites.map((site) => {
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

      {/* Edit Planning Site Dialog */}
      <Dialog open={openEditSiteDialog} onClose={handleCloseEditSiteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Modifier le site du planning
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Date Planifiée"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editSiteFormData.planned_date || ''}
            onChange={(e) => {
              const newData = { ...editSiteFormData, planned_date: e.target.value };
              const planned = newData.planned_date;
              const effective = newData.effective_date;
              const isDelayed = planned && effective ? (new Date(effective) > new Date(planned)) : false;
              setEditSiteFormData({ ...newData, is_delayed: isDelayed ? 1 : 0 });
            }}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Date Effective"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editSiteFormData.effective_date || ''}
            onChange={(e) => {
              const newData = { ...editSiteFormData, effective_date: e.target.value };
              const planned = newData.planned_date;
              const effective = newData.effective_date;
              const isDelayed = planned && effective ? (new Date(effective) > new Date(planned)) : false;
              setEditSiteFormData({ ...newData, is_delayed: isDelayed ? 1 : 0 });
            }}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Statut</InputLabel>
            <Select
              value={editSiteFormData.status}
              label="Statut"
              onChange={(e) => setEditSiteFormData({ ...editSiteFormData, status: e.target.value as any })}
            >
              <MenuItem value="planned">Planifié</MenuItem>
              <MenuItem value="active">Actif</MenuItem>
              <MenuItem value="finished">Terminé</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!editSiteFormData.is_delayed}
                disabled
              />
            }
            label="Délai"
            sx={{ mt: 2, display: 'block' }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={editSiteFormData.description || ''}
            onChange={(e) => setEditSiteFormData({ ...editSiteFormData, description: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditSiteDialog}>Annuler</Button>
          <Button onClick={handleSaveEditedPlanningSite} variant="contained">
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default PlanningPage;
