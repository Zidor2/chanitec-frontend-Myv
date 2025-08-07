import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Card,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import './HistoryPage.scss';
import { ReceiptLongOutlined } from '@mui/icons-material';
import AddAlarmIcon from '@mui/icons-material/AddAlarm';
import { Client, Site, Quote } from '../../models/Quote';
import { apiService } from '../../services/api-service';
import { extractBaseId } from '../../utils/id-generator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CustomNumberInput from '../../components/CustomNumberInput/CustomNumberInput';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface HistoryPageProps {
  currentPath: string;
  onNavigate: (path: string, quoteId?: string) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ currentPath, onNavigate }) => {
  // Filter state
  const [filters, setFilters] = useState({
    id: '',
    client: '',
    site: '',
    period: 'all',
    startDate: '',
    endDate: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);

  // Group quotes by parentId (originals by their own id, updates by parentId)
  const groupedQuotes = React.useMemo(() => {
    const groups: { [groupId: string]: Quote[] } = {};
    for (const quote of filteredQuotes) {
      // Treat parentId of '', undefined, or '0' as no parent (original)
      const hasValidParent = quote.parentId && quote.parentId !== '' && quote.parentId !== '0';
      let groupId = hasValidParent ? quote.parentId : quote.id;
      if (!groupId) groupId = quote.id; // Ensure groupId is always a string
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(quote);
    }
    // Sort each group by createdAt (oldest first)
    Object.values(groups).forEach(group => {
      group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return groups;
  }, [filteredQuotes]);

  // Local state for reminder days per quote
  const [reminderDays, setReminderDays] = useState<{ [quoteId: string]: number }>({});

  // Fetch clients, sites, and quotes on mount
  useEffect(() => {
    const fetchData = async () => {
      const [allClients, allQuotes] = await Promise.all([
        apiService.getClients ? apiService.getClients() : [],
        apiService.getQuotes(),
      ]);
      // Fetch sites for each client and attach
      const clientsWithSites = await Promise.all(
        (allClients || []).map(async (client) => {
          const sites = await apiService.getSitesByClientId(client.id);
          return { ...client, sites: sites || [] };
        })
      );
      setClients(clientsWithSites);
      setQuotes(allQuotes || []);
    };
    fetchData();
  }, []);

  // Update sites when client changes
  useEffect(() => {
    if (filters.client) {
      const client = clients.find(c => c.id === filters.client);
      setSites(client ? client.sites : []);
      // If the selected site does not belong to the new client, reset it
      if (filters.site && !(client && client.sites.some(s => s.id === filters.site))) {
        setFilters(prev => ({ ...prev, site: '' }));
      }
    } else {
      setSites([]);
      setFilters(prev => ({ ...prev, site: '' }));
    }
    // eslint-disable-next-line
  }, [filters.client, clients]);

  // Helper to parse date safely
  const parseQuoteDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr + 'T00:00:00');
    }
    return new Date(dateStr);
  };

  // Apply filters to quotes
  useEffect(() => {
    let result = [...quotes];
    if (filters.id) {
      result = result.filter(q => q.id.includes(filters.id));
    }
    if (filters.client) {
      result = result.filter(q => q.clientName === (clients.find(c => c.id === filters.client)?.name));
    }
    if (filters.site) {
      result = result.filter(q => q.siteName === (sites.find(s => s.id === filters.site)?.name));
    }
    // Date filtering logic for period
    if (filters.period !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (filters.period === 'today') {
        result = result.filter(q => {
          const quoteDate = parseQuoteDate(q.date);
          quoteDate.setHours(0, 0, 0, 0);
          return quoteDate.getTime() === today.getTime();
        });
      } else if (filters.period === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        result = result.filter(q => {
          const quoteDate = parseQuoteDate(q.date);
          return quoteDate >= startOfWeek && quoteDate <= today;
        });
      } else if (filters.period === 'month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        result = result.filter(q => {
          const quoteDate = parseQuoteDate(q.date);
          return quoteDate >= startOfMonth && quoteDate <= today;
        });
      } else if (filters.period === 'year') {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        result = result.filter(q => {
          const quoteDate = parseQuoteDate(q.date);
          return quoteDate >= startOfYear && quoteDate <= today;
        });
      } else if (filters.period === 'custom' && filters.startDate && filters.endDate) {
        const startDate = parseQuoteDate(filters.startDate);
        const endDate = parseQuoteDate(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        result = result.filter(q => {
          const quoteDate = parseQuoteDate(q.date);
          return quoteDate >= startDate && quoteDate <= endDate;
        });
      }
    }
    setFilteredQuotes(result);
    // eslint-disable-next-line
  }, [filters, quotes, clients, sites]);

  // Handlers
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  const handleClearFilters = () => {
    setFilters({ id: '', client: '', site: '', period: 'all', startDate: '', endDate: '' });
  };

  // Handlers for quote card actions
  const handleLoadQuote = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      if (quote.reminderDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reminder = new Date(quote.reminderDate);
        reminder.setHours(0, 0, 0, 0);
        if (reminder < today) {
          alert("Attention : la date de rappel de ce devis est dépassée !");
        }
      }
      if (quote.confirmed) {
        onNavigate(`/quote?id=${quoteId}`);
      } else {
        onNavigate(`/quote?id=${quoteId}&showConfirm=true`);
      }
    }
  };
  const handleDeleteQuote = async (quoteId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      // Call backend to delete by id only
      await apiService.deleteQuote(quoteId);
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
    }
  };
  const handleViewPriceOffer = (quoteId: string) => {
    onNavigate('/price-offer', quoteId);
  };
  const handleReminderChange = (quoteId: string, value: number) => {
    setReminderDays(prev => ({ ...prev, [quoteId]: value }));
  };
  const handleSetReminder = async (quoteId: string) => {
    const days = reminderDays[quoteId] || 0;
    if (days < 1) return;
    const currentDate = new Date();
    const reminderDate = new Date(currentDate.setDate(currentDate.getDate() + days));
    const formattedDate = reminderDate.toISOString().split('T')[0];
    // Use fetch directly since fetchApi is private
    await fetch(`${process.env.REACT_APP_API_URL}/quotes/${quoteId}/reminder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderDate: formattedDate }),
    });
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, reminderDate: formattedDate } : q));
    alert('Rappel configuré avec succès');
  };

  // Helper function to format date
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <Box className="history-page">
        {/* Header Section */}
        <Box className="page-header">
          <Container maxWidth="lg">
            <Box className="header-content">
              <Typography variant="h4" className="page-title">
                Historique
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => onNavigate('/quote')}
                className="create-quote-btn"
              >
                Créer une feuille de calcul
              </Button>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" className="main-content">
          {/* Filter Section */}
          <Card className="filter-card">
            <Box className="filter-content">
              <Typography variant="h6" className="filter-title">
                Filtres
              </Typography>
              <Box className="filters-grid">
                <TextField
                  fullWidth
                  label="ID"
                  variant="outlined"
                  size="small"
                  value={filters.id}
                  onChange={e => handleFilterChange('id', e.target.value)}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Client</InputLabel>
                  <Select
                    label="Client"
                    value={filters.client}
                    onChange={e => handleFilterChange('client', e.target.value as string)}
                  >
                    <MenuItem value="">Tous les clients</MenuItem>
                    {(clients || []).map(client => (
                      <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Site</InputLabel>
                  <Select
                    label="Site"
                    value={filters.site}
                    onChange={e => handleFilterChange('site', e.target.value as string)}
                    disabled={!filters.client}
                  >
                    <MenuItem value="">Tous les sites</MenuItem>
                    {(sites || []).map(site => (
                      <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Période</InputLabel>
                  <Select
                    label="Période"
                    value={filters.period}
                    onChange={e => handleFilterChange('period', e.target.value as string)}
                  >
                    <MenuItem value="all">Toutes les dates</MenuItem>
                    <MenuItem value="today">Aujourd'hui</MenuItem>
                    <MenuItem value="week">Cette semaine</MenuItem>
                    <MenuItem value="month">Ce mois</MenuItem>
                    <MenuItem value="year">Cette année</MenuItem>
                    <MenuItem value="custom">Période personnalisée</MenuItem>
                  </Select>
                </FormControl>

                {/* Show date pickers if custom period is selected */}
                {filters.period === 'custom' && (
                  <>
                    <TextField
                      label="Date de début"
                      type="date"
                      size="small"
                      value={filters.startDate}
                      onChange={e => handleFilterChange('startDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Date de fin"
                      type="date"
                      size="small"
                      value={filters.endDate}
                      onChange={e => handleFilterChange('endDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}
              </Box>

              <Box className="filter-actions">
                <Button variant="outlined" size="small" onClick={handleClearFilters}>
                  Effacer les filtres
                </Button>
              </Box>
            </Box>
          </Card>

                    {/* Quotes List */}
          <Box className="quotes-list">
            {Object.entries(groupedQuotes).map(([baseId, versions]) => {
              const originalQuote = versions[0]; // First quote is always the original
              const childQuotes = versions.slice(1); // All other quotes are children

              return (
                <Box key={baseId} className="quote-deck">
                  {/* Parent/Original Quote Card */}
                  <Card className="quote-card parent-card">
                    {/* Blue Header */}
                    <Box className="quote-header">
                      <Typography variant="h6" className="quote-group-title">
                        Quote group: {baseId}
                      </Typography>
                    </Box>

                    {/* White Content Area */}
                    <Box className="quote-content">
                      {/* Left Side - Quote Details */}
                      <Box className="quote-details">
                        <Box className="quote-id-section">
                          <Typography variant="h6" className="quote-id">
                            {originalQuote.id}
                          </Typography>
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Original version"
                            className="version-chip"
                            color="success"
                            size="small"
                          />
                        </Box>

                        <Box className="quote-info">
                          <Box className="info-row">
                            <PersonIcon className="info-icon" />
                            <Typography className="info-text">
                              Client: {originalQuote.clientName || 'test client'}
                            </Typography>
                          </Box>
                          <Box className="info-row">
                            <LocationOnIcon className="info-icon" />
                            <Typography className="info-text">
                              Site: {originalQuote.siteName || 'tunis site 1'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Right Side - Date and Price */}
                      <Box className="quote-summary">
                        <Box className="date-section">
                          <CalendarTodayIcon className="date-icon" />
                          <Typography className="date-text">
                            Date: {formatDate(originalQuote.date)}
                          </Typography>
                        </Box>
                        <Box className="price-section">
                          <Typography className="price-label">Total TTC:</Typography>
                          <Typography className="price-value">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }).format(originalQuote.totalTTC)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Footer with Reminder and Actions */}
                    <Divider className="content-divider" />
                    <Box className="quote-footer">
                      {/* Left Side - Reminder Days */}
                      <Box className="reminder-section">
                        <Typography className="reminder-label">Reminder days:</Typography>
                        <Box className="reminder-input">
                          <IconButton
                            size="small"
                            onClick={() => handleReminderChange(originalQuote.id, Math.max(0, (reminderDays[originalQuote.id] || 0) - 1))}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            value={reminderDays[originalQuote.id] || 0}
                            onChange={(e) => handleReminderChange(originalQuote.id, parseInt(e.target.value) || 0)}
                            size="small"
                            className="reminder-days-input"
                            inputProps={{
                              style: { textAlign: 'center', width: '40px' },
                              min: 0
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleReminderChange(originalQuote.id, (reminderDays[originalQuote.id] || 0) + 1)}
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleSetReminder(originalQuote.id)}
                            className="add-reminder-btn"
                          >
                            <AddAlarmIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Right Side - Action Buttons */}
                      <Box className="action-buttons">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleLoadQuote(originalQuote.id)}
                          className="view-btn"
                        >
                          View
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ReceiptLongOutlined />}
                          onClick={() => handleViewPriceOffer(originalQuote.id)}
                          className="view-offer-btn"
                        >
                          View offer
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteQuote(originalQuote.id)}
                          className="delete-btn"
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Card>

                  {/* Child Quote Cards - Stacked Underneath */}
                  {childQuotes.map((childQuote, index) => (
                    <Card key={childQuote.id} className="quote-card child-card">
                      {/* White Content Area */}
                      <Box className="quote-content">
                        {/* Left Side - Quote Details */}
                        <Box className="quote-details">
                          <Box className="quote-id-section">
                            <Typography variant="h6" className="quote-id">
                              {childQuote.id}
                            </Typography>
                            <Chip
                              icon={<CheckCircleIcon />}
                              label={`Version ${index + 2}`}
                              className="version-chip child"
                              color="warning"
                              size="small"
                            />
                          </Box>

                          <Box className="quote-info">
                            <Box className="info-row">
                              <PersonIcon className="info-icon" />
                              <Typography className="info-text">
                                Client: {childQuote.clientName || 'test client'}
                              </Typography>
                            </Box>
                            <Box className="info-row">
                              <LocationOnIcon className="info-icon" />
                              <Typography className="info-text">
                                Site: {childQuote.siteName || 'tunis site 1'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Right Side - Date and Price */}
                        <Box className="quote-summary">
                          <Box className="date-section">
                            <CalendarTodayIcon className="date-icon" />
                            <Typography className="date-text">
                              Date: {formatDate(childQuote.date)}
                            </Typography>
                          </Box>
                          <Box className="price-section">
                            <Typography className="price-label">Total TTC:</Typography>
                            <Typography className="price-value">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(childQuote.totalTTC)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Footer with Actions Only (No Reminder for Children) */}
                      <Divider className="content-divider" />
                      <Box className="quote-footer">
                        <Box className="action-buttons">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleLoadQuote(childQuote.id)}
                            className="view-btn"
                          >
                            View
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ReceiptLongOutlined />}
                            onClick={() => handleViewPriceOffer(childQuote.id)}
                            className="view-offer-btn"
                          >
                            View offer
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteQuote(childQuote.id)}
                            className="delete-btn"
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              );
            })}
          </Box>
        </Container>
      </Box>
  );
};

export default HistoryPage;