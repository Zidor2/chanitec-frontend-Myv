import React, { useState, useEffect, useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import logo512 from '../../assets/logo512.png';
import CHANitec from '../../assets/CHANitec.png';

import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  List,
  ListItem,
  Card,
  CardContent,
  Snackbar,
  Alert,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  AcUnit as AcUnitIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { Client, Site, Split } from '../../models/Quote'; // <-- Import Split here
import { apiService } from '../../services/api-service';
import './ClientsPage.scss';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface SplitLookupResult {
  exists: boolean;
  clientName?: string;
  siteName?: string;
  siteId?: string;
}

async function fetchSplitCodeLookup(code: string): Promise<SplitLookupResult> {
  const trimmed = code.trim();
  if (!trimmed) return { exists: false };
  const res = await fetch(
    `${API_BASE_URL}/splits/lookup?code=${encodeURIComponent(trimmed)}`
  );
  if (!res.ok) throw new Error('Lookup failed');
  return res.json();
}

/** True if this code is already used on another site (or any site when site id is still temporary). */
function isSplitCodeConflictForCurrentSite(
  lookup: SplitLookupResult,
  currentSiteId: string
): boolean {
  if (!lookup.exists) return false;
  if (!lookup.siteId) return true;
  if (currentSiteId.startsWith('temp-')) return true;
  return lookup.siteId !== currentSiteId;
}

/** Same non-empty code used more than once in the dialog (any site). */
function findDuplicateSplitCodesInForm(sites: Site[] | undefined): string | null {
  const seen = new Map<string, string>();
  for (const site of sites || []) {
    for (const sp of site.splits || []) {
      const c = (sp.Code || '').trim();
      if (!c) continue;
      const key = c.toLowerCase();
      if (seen.has(key)) return c;
      seen.set(key, c);
    }
  }
  return null;
}

interface ClientsPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}


const ClientsPage: React.FC<ClientsPageProps> = ({ currentPath, onNavigate, onLogout }) => {
  // State for clients data
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSitesLoading, setClientSitesLoading] = useState<{[clientId: string]: boolean}>({});
  const [loading, setLoading] = useState(false);

  // State for filters
  const [filterSite, setFilterSite] = useState<string[]>([]);
  const [filterSplitType, setFilterSplitType] = useState<string[]>([]);
  const [filterFreon, setFilterFreon] = useState<string[]>([]);
  const [filterPuissance, setFilterPuissance] = useState<string[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<'site' | 'freon' | 'puissance'>('site');

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

  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [originalClientSites, setOriginalClientSites] = useState<Site[]>([]);
  const [deletedSplits, setDeletedSplits] = useState<number[]>([]);
  const [puissanceInputs, setPuissanceInputs] = useState<{[key: string]: string}>({});
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [originalEditingSite, setOriginalEditingSite] = useState<Site | null>(null);

  // Get unique sites for selected client
  const getAvailableSites = (): Site[] => {
    if (!selectedClientId) return [];
    const client = clients.find(c => c.id === selectedClientId);
    return client?.sites || [];
  };

  // Filter sites and splits based on selected filters
  const getFilteredSites = () => {
    let sites = getAvailableSites();

    if (filterSite.length > 0) {
      sites = sites.filter(site => filterSite.includes(site.id));
    }

    // Apply split filters to each site, but keep every site so all sites are still shown
    return sites.map(site => ({
      ...site,
      splits: (site.splits || []).filter(split => {
        // Filter by split type (name)
        if (filterSplitType.length > 0 && !filterSplitType.includes(split.name || '')) {
          return false;
        }
        // Filter by freon
        if (filterFreon.length > 0 && !filterFreon.includes(split.freon || '')) {
          return false;
        }
        // Filter by selected puissance values
        if (filterPuissance.length > 0) {
          const splitPuissance = typeof split.puissance === 'number'
            ? split.puissance
            : parseFloat(String(split.puissance || ''));
          if (Number.isNaN(splitPuissance) || !filterPuissance.includes(String(splitPuissance))) {
            return false;
          }
        }
        return true;
      })
    }));
  };

  // Get unique split types for the dropdown
  const getUniqueSplitTypes = (): string[] => {
    const sites = getAvailableSites();
    const types = new Set<string>();
    sites.forEach(site => {
      (site.splits || []).forEach(split => {
        if (split.name) types.add(split.name);
      });
    });
    return Array.from(types).sort();
  };

  // Get unique freon types for the dropdown
  const getUniqueFreonTypes = (): string[] => {
    const sites = getAvailableSites();
    const freons = new Set<string>();
    sites.forEach(site => {
      (site.splits || []).forEach(split => {
        if (split.freon) freons.add(split.freon);
      });
    });
    return Array.from(freons).sort();
  };

  const getUniquePuissanceValues = (): number[] => {
    const sites = getAvailableSites();
    const values = new Set<number>();
    sites.forEach(site => {
      (site.splits || []).forEach(split => {
        if (typeof split.puissance === 'number' && !Number.isNaN(split.puissance)) {
          values.add(split.puissance);
        } else if (typeof split.puissance === 'string' && split.puissance.trim() !== '') {
          const parsed = parseFloat(split.puissance);
          if (!Number.isNaN(parsed)) values.add(parsed);
        }
      });
    });
    return Array.from(values).sort((a, b) => a - b);
  };

  const getSelectedFilterSummary = () => {
    const siteLabels = filterSite.length
      ? filterSite.map(id => getAvailableSites().find(site => site.id === id)?.name || id).join(', ')
      : 'Tous';
    const splitTypeLabels = filterSplitType.length ? filterSplitType.join(', ') : 'Tous';
    const freonLabels = filterFreon.length ? filterFreon.join(', ') : 'Tous';
    const puissanceLabels = filterPuissance.length ? filterPuissance.join(', ') : 'Tous';

    return `Sites: ${siteLabels} · Types: ${splitTypeLabels} · Fluide: ${freonLabels} · Puissances: ${puissanceLabels}`;
  };

  const getFilteredChartData = () => {
    const sites = getFilteredSites();
    const allSplits = sites.flatMap(site => site.splits || []);

    if (selectedChartType === 'site') {
      const counts = sites.map(site => ({
        name: site.name,
        value: (site.splits || []).length
      })).filter(item => item.value > 0);
      return counts;
    }

    if (selectedChartType === 'freon') {
      const counts: Record<string, number> = {};
      allSplits.forEach(split => {
        const key = split.freon || 'Inconnu';
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    const counts: Record<string, number> = {};
    allSplits.forEach(split => {
      const puissance = typeof split.puissance === 'number'
        ? split.puissance
        : parseFloat(String(split.puissance || ''));
      const name = Number.isNaN(puissance) ? 'Inconnu' : String(puissance);
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        if (a.name === 'Inconnu') return 1;
        if (b.name === 'Inconnu') return -1;
        return parseFloat(a.name) - parseFloat(b.name);
      });
  };

  const getDialogSites = (): Site[] => {
    return currentClient.sites || [];
  };

  const getChartSegmentPaths = (data: { name: string; value: number }[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    const cx = 100;
    const cy = 100;
    const r = 80;
    let startAngle = 0;

    // Generate visually distinct colors using the golden angle to avoid repeats
    const goldenAngle = 137.50776405003785; // degrees
    const colors = data.map((_, index) => {
      const hue = (index * goldenAngle) % 360;
      return `hsl(${Math.round(hue)}, 70%, 50%)`;
    });

    return data.map((entry, index) => {
      const angle = (entry.value / total) * 360;
      const endAngle = startAngle + angle;
      const start = {
        x: cx + r * Math.cos((Math.PI / 180) * startAngle),
        y: cy + r * Math.sin((Math.PI / 180) * startAngle)
      };
      const end = {
        x: cx + r * Math.cos((Math.PI / 180) * endAngle),
        y: cy + r * Math.sin((Math.PI / 180) * endAngle)
      };
      const largeArcFlag = angle > 180 ? 1 : 0;
      const path = angle >= 359.999
        ? `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 -${2 * r} 0`
        : `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
      const segment = {
        path,
        color: colors[index],
        name: entry.name,
        value: entry.value
      };
      startAngle = endAngle;
      return segment;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterSite([]);
    setFilterSplitType([]);
    setFilterFreon([]);
    setFilterPuissance([]);
  };

  // Save chart to PDF
  const handleSavePDF = () => {
    const element = document.getElementById('chart-section');
    if (!element) return;
    const options = {
      margin: 10,
      filename: 'chart.pdf',
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    element.classList.add('pdf-export');

    // Show background logos during export
    const logos = Array.from(element.querySelectorAll('.clients-background-logo, .clients-background-logo-second')) as HTMLElement[];
    logos.forEach(logo => {
      logo.style.display = 'block';
    });

    // Temporarily hide interactive controls via inline styles for robust export
    const controls = Array.from(element.querySelectorAll('button, input, select, .MuiFormControl-root, .MuiOutlinedInput-root, .MuiButton-root, [role="button"]')) as HTMLElement[];
    const prevStyles = controls.map(el => el.getAttribute('style') || '');
    controls.forEach(el => {
      try { el.style.setProperty('display', 'none', 'important'); el.style.setProperty('visibility', 'hidden', 'important'); } catch (e) {}
    });

    html2pdf().set(options).from(element).save().finally(() => {
      controls.forEach((el, i) => {
        try { el.setAttribute('style', prevStyles[i] || ''); } catch (e) {}
      });

      // Hide logos after export
      logos.forEach(logo => {
        logo.style.display = 'none';
      });

      element.classList.remove('pdf-export');
    });
  };

  // Show snackbar with message
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Load only clients
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const clientsData = await apiService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      showSnackbar('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Load sites and splits for selected client
  const loadSitesAndSplitsForSelectedClient = useCallback(async (clientId: string) => {
    setClientSitesLoading(prev => ({ ...prev, [clientId]: true }));
    try {
      const sites = await apiService.getSitesByClientId(clientId);
      const sitesWithSplits = await Promise.all(
        sites.map(async (site) => {
          const splits = await apiService.getSplitsBySiteId(site.id);
          return { ...site, splits };
        })
      );
      setClients(prevClients => prevClients.map(c =>
        c.id === clientId ? { ...c, sites: sitesWithSplits } : c
      ));
    } catch (error) {
      showSnackbar('Erreur lors du chargement des sites/splits', 'error');
    } finally {
      setClientSitesLoading(prev => ({ ...prev, [clientId]: false }));
    }
  }, [showSnackbar]);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Load sites and splits when client selection changes
  useEffect(() => {
    if (selectedClientId && !clientSitesLoading[selectedClientId]) {
      const client = clients.find(c => c.id === selectedClientId);
      if (!client?.sites) {
        loadSitesAndSplitsForSelectedClient(selectedClientId);
      }
    }
  }, [selectedClientId, clients, clientSitesLoading, loadSitesAndSplitsForSelectedClient]);

  // Open dialog to add a new client
  const handleAddClient = () => {
    setCurrentClient({
      name: '',
      sites: [],
      Taux_marge: 0
    });
    setNewSiteName('');
    setIsEditing(false);
    setEditingSite(null);
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

  const validateSplitCodesWithServer = async (): Promise<string | null> => {
    const sites = getDialogSites();
    for (const site of sites) {
      for (const split of site.splits || []) {
        const code = (split.Code || '').trim();
        if (!code) continue;
        try {
          const lookup = await fetchSplitCodeLookup(code);
          if (isSplitCodeConflictForCurrentSite(lookup, site.id)) {
            if (lookup.exists && lookup.clientName && lookup.siteName) {
              return `Ce code split existe déjà : ${lookup.clientName} > ${lookup.siteName}`;
            }
            return 'Ce code split existe déjà pour un autre emplacement.';
          }
        } catch {
          return 'Impossible de vérifier le code split. Réessayez.';
        }
      }
    }
    return null;
  };

  // Save client (either create new or update existing)
  const handleSave = async () => {
    if (!editingSite && !currentClient.name?.trim()) {
      showSnackbar('Le nom du client est requis', 'error');
      return;
    }
    const dialogSites = getDialogSites();
    const dupCode = findDuplicateSplitCodesInForm(dialogSites);
    if (dupCode) {
      showSnackbar(
        `Le code split "${dupCode}" est utilisé plusieurs fois dans le formulaire.`,
        'error'
      );
      return;
    }
    const serverErr = await validateSplitCodesWithServer();
    if (serverErr) {
      showSnackbar(serverErr, 'error');
      return;
    }
    if (editingSite) {
      await handleUpdateSiteOnly();
      return;
    }
    if (isEditing) {
      await handleUpdateClientAndSites();
    } else {
      await handleCreateClientAndSite();
    }
  };

  // Renamed function for creating a NEW client and its first site
  const handleCreateClientAndSite = async () => {
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
      const newClient = await apiService.saveClient({
        name: (currentClient.name ?? '').trim(),
        Taux_marge: currentClient.Taux_marge || 0,
        sites: []
      });

      // 2. Create the site with the new client's ID
      const newSite = await apiService.saveSite({
        name: siteNameToUse,
        client_id: newClient.id
      });

      // Create splits for this site
      const splits = (currentClient.sites?.[0]?.splits ?? []);
      await Promise.all(splits.map(split =>
        apiService.createSplit({
          code: split.Code,
          name: split.name,
          description: split.description,
          puissance: split.puissance,
          site_id: newSite.id
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

    setLoading(true);
    try {
      // 1. Update Client Name
      const clientUpdateResponse = await fetch(`${API_BASE_URL}/clients/${currentClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (currentClient.name ?? '').trim(),
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

      // Create or update splits for existing sites
      await Promise.all(sitesToUpdate.map(async site => {
        const originalSite = originalSites.find(os => os.id === site.id);
        const originalSplitIds = new Set(
          (originalSite?.splits ?? [])
            .map(sp => sp.id)
            .filter((id): id is number => id !== undefined)
        );

        await Promise.all((site.splits ?? []).map(split => {
          // Ensure puissance is properly typed
          const cleanSplit = {
            ...split,
            puissance: split.puissance === null ? null : (typeof split.puissance === 'string' && split.puissance === '' ? null : parseFloat(String(split.puissance)) || 0)
          };

          if (split.id !== null && split.id !== undefined && typeof split.id === 'number' && originalSplitIds.has(split.id)) {
            // Update existing split - include code in the update
            return fetch(`${API_BASE_URL}/splits/${split.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: cleanSplit.Code,
                name: cleanSplit.name,
                description: cleanSplit.description,
                puissance: cleanSplit.puissance,
                site_id: site.id,
                freon: cleanSplit.freon || null
              })
            });
          }
          // Create new split
          return fetch(`${API_BASE_URL}/splits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: cleanSplit.Code,
              name: cleanSplit.name,
              description: cleanSplit.description,
              puissance: cleanSplit.puissance,
              site_id: site.id,
              freon: cleanSplit.freon || null
            })
          });
        }));
      }));

      // Delete removed sites
      await Promise.all(sitesToDelete.map(site =>
        fetch(`${API_BASE_URL}/sites/${site.id}`, {
          method: 'DELETE'
        })
      ));

      // Delete removed splits (by id)
      await Promise.all(deletedSplits.map(id =>
        fetch(`${API_BASE_URL}/splits/${id}`, {
          method: 'DELETE'
        })
      ));

      showSnackbar('Client mis à jour avec succès', 'success');
      handleCloseDialog();
      await loadClients();

      const updatedClientId = currentClient.id ?? selectedClientId;
      if (updatedClientId) {
        setSelectedClientId(updatedClientId);
        await loadSitesAndSplitsForSelectedClient(updatedClientId);
      }

      setDeletedSplits([]); // Reset after update

    } catch (error) {
      console.error('Error updating client and sites:', error);
      showSnackbar('Erreur lors de la mise à jour du client', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSiteOnly = async () => {
    const siteToSave = currentClient.sites?.[0];
    if (!editingSite || !siteToSave || !selectedClient) {
      showSnackbar('Impossible de mettre à jour le site', 'error');
      return;
    }
    if (!siteToSave.name?.trim()) {
      showSnackbar('Le nom du site est requis', 'error');
      return;
    }

    setLoading(true);
    try {
      if (siteToSave.id && siteToSave.name !== editingSite.name) {
        await apiService.updateSite(siteToSave.id, { name: siteToSave.name });
      }

      const originalSplitIds = new Set(
        (originalEditingSite?.splits ?? [])
          .map(split => split.id)
          .filter((id): id is number => typeof id === 'number')
      );
      const currentSplitIds = new Set(
        (siteToSave.splits ?? [])
          .map(split => split.id)
          .filter((id): id is number => typeof id === 'number')
      );

      await Promise.all((siteToSave.splits ?? []).map(async split => {
        const splitData = {
          code: split.Code,
          name: split.name,
          description: split.description,
          puissance: split.puissance,
          freon: split.freon || null,
          site_id: siteToSave.id
        };

        if (split.id !== undefined && split.id !== null && typeof split.id === 'number' && originalSplitIds.has(split.id)) {
          await apiService.updateSplit(split.id, splitData);
        } else {
          await apiService.createSplit(splitData);
        }
      }));

      const splitsToDelete = [
        ...deletedSplits,
        ...((originalEditingSite?.splits ?? []).filter(split =>
          split.id !== undefined && split.id !== null && typeof split.id === 'number' && !currentSplitIds.has(split.id)
        ).map(split => split.id as number))
      ];

      await Promise.all(splitsToDelete.map(id => apiService.deleteSplit(id)));

      showSnackbar('Site mis à jour avec succès', 'success');
      handleCloseDialog();
      await loadSitesAndSplitsForSelectedClient(selectedClient.id);
      setDeletedSplits([]);
    } catch (error) {
      console.error('Error updating site:', error);
      showSnackbar('Erreur lors de la mise à jour du site', 'error');
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
    setEditingSite(null);
    setOriginalEditingSite(null);
    setDeletedSplits([]);
    setPuissanceInputs({}); // Clear puissance inputs
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleEditClient = (client: Client) => {
    setCurrentClient(client); // Load current data
    setOriginalClientSites(client.sites || []); // Store original sites for comparison
    setIsEditing(true);
    setEditingSite(null);
    setNewSiteName(''); // Clear new site name field
    setDialogOpen(true);
    setPuissanceInputs({}); // Clear puissance inputs when editing starts
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/clients/${client.id}`, {
        method: 'DELETE'
      });
      showSnackbar('Client supprimé avec succès', 'success');
      setSelectedClientId(null);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      showSnackbar('Erreur lors de la suppression du client', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSite = (site: Site) => {
    if (!selectedClient) return;
    const editableSite = {
      ...site,
      splits: (site.splits ?? []).map(split => ({ ...split }))
    };
    setEditingSite(site);
    setOriginalEditingSite(site);
    setCurrentClient({
      id: selectedClient.id,
      name: selectedClient.name,
      Taux_marge: selectedClient.Taux_marge,
      sites: [editableSite]
    });
    setIsEditing(false);
    setNewSiteName('');
    setDialogOpen(true);
    setDeletedSplits([]);
    setPuissanceInputs({});
  };

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
  const filteredSites = getFilteredSites();
  const filteredChartData = getFilteredChartData();
  const chartSegments = getChartSegmentPaths(filteredChartData);
  const chartTotal = filteredChartData.reduce((sum, item) => sum + (item?.value || 0), 0);

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
                  + Créer un client
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" className="main-content">
          {/* All Clients List Section */}
          {!selectedClientId ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Sélectionnez un client</Typography>
              {loading ? (
                <Box className="loading-container">
                  <Typography>Chargement...</Typography>
                </Box>
              ) : clients.length === 0 ? (
                <Box className="empty-container">
                  <Typography>Aucun client trouvé</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {clients.map((client) => (
                    <Card
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {client.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Sites : {client.sites?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Taux de marge : {client.Taux_marge || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          ) : selectedClient ? (
            <Box>
              {/* Selected Client Info */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ mb: 0.5 }}>
                    {selectedClient.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Taux de marge: {selectedClient.Taux_marge || 0}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditClient(selectedClient)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClient(selectedClient)}
                  >
                    Supprimer
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedClientId(null);
                      clearFilters();
                    }}
                  >
                    Retour aux clients
                  </Button>
                </Box>
              </Box>

              {/* Filter Section */}
              <Box className="filter-section" sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Filtres
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                  {/* Filtre site */}
                  <TextField
                    select
                    label="Site"
                    value={filterSite}
                    variant="outlined"
                    size="small"
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[]).length > 0
                          ? (selected as string[]).map(id => getAvailableSites().find(site => site.id === id)?.name || id).join(', ')
                          : 'Tous les sites',
                      onChange: (e: any) => setFilterSite(e.target.value as string[])
                    }}
                  >
                    {getAvailableSites().map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Split Type Filter */}
                  <TextField
                    select
                    label="Type de split"
                    value={filterSplitType}
                    variant="outlined"
                    size="small"
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[]).length > 0
                          ? (selected as string[]).join(', ')
                          : 'Tous les types',
                      onChange: (e: any) => setFilterSplitType(e.target.value as string[])
                    }}
                  >
                    {getUniqueSplitTypes().map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Freon Filter */}
                  <TextField
                    select
                    label="Fluide frigorigène"
                    value={filterFreon}
                    variant="outlined"
                    size="small"
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[]).length > 0
                          ? (selected as string[]).join(', ')
                          : 'Tous les fluides',
                      onChange: (e: any) => setFilterFreon(e.target.value as string[])
                    }}
                  >
                    {getUniqueFreonTypes().map((freon) => (
                      <MenuItem key={freon} value={freon}>
                        {freon}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Puissance Filter */}
                  <TextField
                    select
                    label="Puissance"
                    value={filterPuissance}
                    variant="outlined"
                    size="small"
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[]).length > 0
                          ? (selected as string[]).join(', ')
                          : 'Toutes les puissances',
                      onChange: (e: any) => setFilterPuissance(e.target.value as string[])
                    }}
                  >
                    {getUniquePuissanceValues().map((value) => (
                      <MenuItem key={value} value={value.toString()}>
                        {value}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                >
                  Réinitialiser
                </Button>
              </Box>

              {/* Chart Panel */}
              <Card id="chart-section" sx={{ mb: 3, position: 'relative' }}>
                <CardContent sx={{ position: 'relative' }}>
                  {/* Background Logos */}
                  <img src={logo512} alt="Background Logo" className="clients-background-logo" style={{ display: 'none', opacity: 0.15 }} />
                  <img src={CHANitec} alt="Chanitec Logo" className="clients-background-logo-second" style={{ display: 'none', opacity: 0.15 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {'Total équipements : ' + chartTotal}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        select
                        label="Graphique"
                        value={selectedChartType}
                        onChange={(e) => setSelectedChartType(e.target.value as 'site' | 'freon' | 'puissance')}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="site">Nombre d'équipements par site</MenuItem>
                        <MenuItem value="freon">Répartition des fluides</MenuItem>
                        <MenuItem value="puissance">Répartition de la puissance</MenuItem>
                      </TextField>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleSavePDF}
                      >
                        Sauvegarder PDF
                      </Button>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
                    <Box className="pdf-header" sx={{ display: 'none', width: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: '700', textAlign: 'center' }}>
                        {selectedChartType === 'site' ? "Nombre d'équipements par site" : selectedChartType === 'freon' ? 'Répartition des fluides' : 'Répartition de la puissance'}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ textAlign: 'center', mt: 1 }}>
                        {getSelectedFilterSummary()}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 220, flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <svg width="220" height="220" viewBox="0 0 200 200">
                        {chartSegments.map((segment, index) => (
                          <path key={index} d={segment.path} fill={segment.color} />
                        ))}
                      </svg>
                    </Box>
                    <Box className="on-screen-legend" sx={{ flex: 1 }}>
                      {filteredChartData.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">
                          Aucune donnée disponible pour le graphique et les filtres sélectionnés.
                        </Typography>
                      ) : (
                        chartSegments.map((segment) => (
                          <Box key={segment.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: 14, height: 14, mr: 1, bgcolor: segment.color, borderRadius: '50%' }} />
                            <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                              {segment.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {segment.value}
                            </Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                    <Box className="pdf-legend" sx={{ display: 'none', width: '100%' }}>
                      {chartSegments.map((segment) => (
                        <Box key={segment.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                          <Box sx={{ width: 14, height: 14, bgcolor: segment.color, borderRadius: '50%' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{segment.name}</Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>({segment.value})</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Sites and Splits Display */}
              {clientSitesLoading[selectedClientId] ? (
                <Box className="loading-container">
                  <Typography>Chargement des sites...</Typography>
                </Box>
              ) : filteredSites.length === 0 ? (
                <Box className="empty-container">
                  <Typography>Aucun équipement correspondant aux filtres</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {filteredSites.map((site) => (
                    <Card key={site.id}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              {site.name}
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditSite(site); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box className="splits-section">
                          {site.splits && site.splits.length > 0 ? (
                            site.splits.map((split, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5, p: 1, bgcolor: '#f5f5f5', borderRadius: 0.5 }}>
                                <AcUnitIcon sx={{ mr: 1, mt: 0.5, color: '#81d4fa' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {split.Code || 'N/A'} - {split.name || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Puissance: {split.puissance || 0} BTU/KW
                                  </Typography>
                                  {split.freon && (
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                      Fluide : {split.freon}
                                    </Typography>
                                  )}
                                  {split.description && (
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                      Marque: {split.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Aucun équipement
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          ) : null}
        </Container>
      </Box>

      {/* Add/Edit Client Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { width: '95vw', maxWidth: '1200px' } }}
      >
        <DialogTitle>
          {editingSite ? `Modifier le site ${editingSite.name}` : isEditing ? 'Modifier le client' : 'Nouveau Client'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: '60vh' }}>
                     <TextField
             autoFocus
             margin="dense"
             label="Nom du client"
             type="text"
             fullWidth
             value={currentClient.name}
             onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
           />
          {/* Show site name field when creating or editing a client, not when editing a single site */}
          {!editingSite && (currentClient.sites?.length || 0) === 0 && (
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

          {/* Show option to add another site when creating or editing a client */}
          {!editingSite && (currentClient.sites?.length || 0) > 0 && (
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
                  secondaryAction={!editingSite ? (
                    <IconButton edge="end" onClick={() => handleRemoveSite(site.id)}>
                      <DeleteIcon />
                    </IconButton>
                  ) : undefined}
                >
                  <TextField
                    label="Nom du site"
                    size="small"
                    fullWidth
                    value={site.name}
                    onChange={(e) => {
                      const newSites = (currentClient.sites || []).map((s, idx) =>
                        idx === siteIdx
                          ? { ...s, name: e.target.value }
                          : s
                      );
                      setCurrentClient({ ...currentClient, sites: newSites });
                    }}
                  />
                </ListItem>
                {!isEditing || editingSite ? (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>Équipement frigorifique</Typography>
                    {(site.splits ?? []).map((split, splitIdx) => (
                      <Box key={splitIdx} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                        <TextField
                          label="Code"
                          size="small"
                          value={split.Code}
                          sx={{ minWidth: 120, flex: '1 1 140px' }}
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
                          onBlur={async (e) => {
                            const code = e.target.value.trim();
                            if (!code) return;
                            try {
                              const lookup = await fetchSplitCodeLookup(code);
                              if (isSplitCodeConflictForCurrentSite(lookup, site.id)) {
                                if (lookup.exists && lookup.clientName && lookup.siteName) {
                                  showSnackbar(
                                    `Ce code split existe déjà : ${lookup.clientName} > ${lookup.siteName}`,
                                    'error'
                                  );
                                } else {
                                  showSnackbar(
                                    'Ce code split existe déjà pour un autre emplacement.',
                                    'error'
                                  );
                                }
                              }
                            } catch {
                              showSnackbar(
                                'Impossible de vérifier le code split. Réessayez.',
                                'error'
                              );
                            }
                          }}
                        />
                        <TextField
                          select
                          label="Type"
                          size="small"
                          value={split.name || ''}
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
                          sx={{ minWidth: 200, flex: '1 1 220px' }}
                        >
                          {split.name && !['Split', 'Ventilo-convecteur', 'Injecto', 'K7 détente direct', 'K7 à eau', 'GF', 'Mini centrale', 'Armoire de clim', 'GP', 'ROOFTOP', 'Split Gainable', 'Mono-bloc', 'Clim Console'].includes(split.name) && (
                            <MenuItem value={split.name}>{split.name}</MenuItem>
                          )}
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
                          <MenuItem value="Mono-bloc">Mono-bloc</MenuItem>
                          <MenuItem value="Clim Console">Clim Console</MenuItem>
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
                          sx={{ minWidth: 200, flex: '1 1 220px' }}
                        />
                        <TextField
                          label="Puissance en BTU/Kw "
                          size="small"
                          value={puissanceInputs[`${site.id}-${splitIdx}`] ?? (split.puissance || '')}
                          onChange={e => {
                            const value = e.target.value;
                            const inputKey = `${site.id}-${splitIdx}`;
                            setPuissanceInputs(prev => ({
                              ...prev,
                              [inputKey]: value
                            }));
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
                          sx={{ minWidth: 180, flex: '1 1 180px' }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            const inputKey = `${site.id}-${splitIdx}`;
                            if (value === '' || isNaN(parseFloat(value))) {
                              setPuissanceInputs(prev => ({
                                ...prev,
                                [inputKey]: String(split.puissance || '')
                              }));
                            }
                          }}
                        />
                        <TextField
                          select
                          label="Fluide Frigorigène"
                          size="small"
                          value={split.freon || ''}
                          onChange={e => {
                            const newSites = (currentClient.sites || []).map((s, idx) =>
                              idx === siteIdx
                                ? {
                                    ...s,
                                    splits: (s.splits ?? []).map((sp, spIdx) =>
                                      spIdx === splitIdx ? { ...sp, freon: e.target.value || null } : sp
                                    )
                                  }
                                : s
                            );
                            setCurrentClient({ ...currentClient, sites: newSites });
                          }}
                          sx={{ minWidth: 120, flex: '1 1 140px' }}
                        >
                          <MenuItem value="">-- Sélectionner --</MenuItem>
                          <MenuItem value="R22">R22</MenuItem>
                          <MenuItem value="R410a">R410a</MenuItem>
                          <MenuItem value="R134a">R134a</MenuItem>
                          <MenuItem value="R32">R32</MenuItem>
                          <MenuItem value="R404">R404</MenuItem>
                        </TextField>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (split.id !== undefined && typeof split.id === 'number') {
                              setDeletedSplits(prev => [...prev, split.id as number]);
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
                          site_id: site.id,
                          freon: null
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
                  </>
                ) : null}
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
