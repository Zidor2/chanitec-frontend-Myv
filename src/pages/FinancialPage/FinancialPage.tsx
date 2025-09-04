import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  SelectChangeEvent,
  InputAdornment,
  Button,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Build as BuildIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { apiService } from '../../services/api-service';
import { itemsApi } from '../../services/api';
import { SupplyItem } from '../../models/Quote';
import './FinancialPage.scss';

interface FinancialPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

interface FinancialSummary {
  totalQuotes: number;
  totalSupplies: number;
  totalLabor: number;
  totalRevenue: number;
  averageQuoteValue: number;
}

const FinancialPage: React.FC<FinancialPageProps> = ({ currentPath, onNavigate, onLogout }) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SupplyItem | null>(null);
  const [allItems, setAllItems] = useState<SupplyItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredQuotes, setFilteredQuotes] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalQuotes: 0,
    totalSupplies: 0,
    totalLabor: 0,
    totalRevenue: 0,
    averageQuoteValue: 0
  });

  // Get unique values for filters - only from latest versions
  const sites = Array.from(new Set(quotes.map(q => q.siteName).filter(Boolean) || []));
  const clients = Array.from(new Set(quotes.map(q => q.clientName).filter(Boolean) || []));
  const objects = Array.from(new Set(quotes.map(q => q.object).filter(Boolean) || []));

  // Get unique equipment (splits) from all quotes
  const equipment = Array.from(new Set(
    quotes.flatMap(q =>
      q.splits?.map((split: any) => split.name || split.description || split.Code) || []
    ).filter(Boolean)
  ));

  // Load all items from the items API
  const loadAllItems = async () => {
    try {
      const items = await itemsApi.getAllItems();
      // Transform the data to match our frontend structure
      const transformedItems = items.map((item: any) => ({
        id: item.id,
        description: item.description,
        priceEuro: item.price,
        quantity: item.quantity
      }));
      setAllItems(transformedItems);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  // Function to get only the latest version of each quote group
  const getLatestQuoteVersions = (allQuotes: any[]) => {
    const quoteGroups = new Map();

    allQuotes.forEach(quote => {
      const key = quote.parentId || quote.id; // Use parentId if exists, otherwise use id

      if (!quoteGroups.has(key) ||
          (quote.version && quoteGroups.get(key).version < quote.version) ||
          (quote.updatedAt && quoteGroups.get(key).updatedAt < quote.updatedAt)) {
        quoteGroups.set(key, quote);
      }
    });

    return Array.from(quoteGroups.values());
  };

  // Fetch quotes and items on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch quotes and items in parallel
        const [fetchedQuotes] = await Promise.all([
          apiService.getQuotes(),
          loadAllItems()
        ]);

        console.log('Raw fetched quotes:', fetchedQuotes);
        console.log('First quote structure:', fetchedQuotes[0]);

        const latestVersions = getLatestQuoteVersions(fetchedQuotes);
        console.log('Latest versions after filtering:', latestVersions);

        // Fetch supply items for each quote
        const quotesWithItems = await Promise.all(
          latestVersions.map(async (quote) => {
            try {
              const supplyItems = await apiService.getSupplyItems(quote.id);
              console.log(`Fetched ${supplyItems.length} supply items for quote ${quote.id}`);
              return {
                ...quote,
                supplyItems: supplyItems
              };
            } catch (error) {
              console.error(`Error fetching supply items for quote ${quote.id}:`, error);
              return {
                ...quote,
                supplyItems: []
              };
            }
          })
        );

        console.log('Quotes with supply items:', quotesWithItems);
        console.log('First quote with items structure:', quotesWithItems[0]);

        setQuotes(quotesWithItems);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterQuotes = useCallback(() => {
    if (!quotes || quotes.length === 0) return;

    let filtered = quotes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(q => {
        const searchLower = searchTerm.toLowerCase();
        return (
          q.clientName?.toLowerCase().includes(searchLower) ||
          q.siteName?.toLowerCase().includes(searchLower) ||
          q.object?.toLowerCase().includes(searchLower) ||
          // Search in equipment (splits)
          q.splits?.some((split: any) =>
            (split.name || split.description || split.Code)?.toLowerCase().includes(searchLower)
          ) ||
          // Search in supply items
          (() => {
            const supplyItems = q.supplyItems || [];
            return Array.isArray(supplyItems) && supplyItems.some((item: any) =>
              item.description?.toLowerCase().includes(searchLower)
            );
          })()
        );
      });
    }

    // Filter by site
    if (selectedSite) {
      filtered = filtered.filter(q => q.siteName === selectedSite);
    }

    // Filter by client
    if (selectedClient) {
      filtered = filtered.filter(q => q.clientName === selectedClient);
    }

    // Filter by object
    if (selectedObject) {
      filtered = filtered.filter(q => q.object === selectedObject);
    }

    // Filter by equipment (splits)
    if (selectedEquipment) {
      filtered = filtered.filter(q =>
        q.splits?.some((split: any) =>
          (split.name || split.description || split.Code) === selectedEquipment
        )
      );
    }

    // Filter by item (supply items)
    if (selectedItem) {
      filtered = filtered.filter(q => {
        const supplyItems = q.supplyItems || [];
        return Array.isArray(supplyItems) && supplyItems.some((item: any) =>
          item.id === selectedItem.id || item.description === selectedItem.description
        );
      });
    }

    // Filter by period
    if (selectedPeriod !== 'all') {
      const currentDate = new Date();

      switch (selectedPeriod) {
        case 'today':
          filtered = filtered.filter(q => {
            const quoteDate = new Date(q.date);
            return quoteDate.toDateString() === currentDate.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(q => new Date(q.date) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(q => new Date(q.date) >= monthAgo);
          break;
        case 'year':
          const yearAgo = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(q => new Date(q.date) >= yearAgo);
          break;
        case 'custom':
          if (startDate && endDate) {
            filtered = filtered.filter(q => {
              const quoteDate = new Date(q.date);
              const start = new Date(startDate);
              const end = new Date(endDate);
              return quoteDate >= start && quoteDate <= end;
            });
          }
          break;
      }
    }

    setFilteredQuotes(filtered);
    // Calculate summary based on filtered quotes only
    calculateFinancialSummary(filtered);
  }, [searchTerm, selectedSite, selectedClient, selectedObject, selectedEquipment, selectedItem, selectedPeriod, startDate, endDate, quotes]);

  useEffect(() => {
    filterQuotes();
  }, [filterQuotes]);

    const calculateFinancialSummary = (quotes: any[]) => {
    const totalQuotes = quotes.length;
    console.log('Calculating financial summary for', totalQuotes, 'FILTERED quotes only');

    const totalSupplies = quotes.reduce((sum, q) => {
      console.log('Processing quote', q.id, 'totalSuppliesHT:', q.totalSuppliesHT, 'type:', typeof q.totalSuppliesHT, 'supplyItems:', q.supplyItems);

      // Convert to number and check if valid
      const suppliesTotal = Number(q.totalSuppliesHT);
      if (q.totalSuppliesHT && !isNaN(suppliesTotal) && suppliesTotal > 0) {
        console.log('Using pre-calculated totalSuppliesHT:', suppliesTotal);
        return sum + suppliesTotal;
      } else {
        console.log('Pre-calculated totalSuppliesHT failed condition:', {
          exists: !!q.totalSuppliesHT,
          convertedValue: suppliesTotal,
          isNaN: isNaN(suppliesTotal),
          greaterThanZero: suppliesTotal > 0,
          originalValue: q.totalSuppliesHT
        });
      }

      // Fallback: calculate from supply items
      if (q.supplyItems && Array.isArray(q.supplyItems) && q.supplyItems.length > 0) {
        const calculatedTotal = q.supplyItems.reduce((itemSum: number, item: any) => {
          const itemTotal = Number(item.totalPriceDollar) || 0;
          return itemSum + itemTotal;
        }, 0);
        console.log('Calculated supplies total from items:', calculatedTotal);
        return sum + calculatedTotal;
      }

      console.log('No valid supplies data for quote', q.id);
      return sum;
    }, 0);

    const totalLabor = quotes.reduce((sum, q) => {
      console.log('Processing quote', q.id, 'totalLaborHT:', q.totalLaborHT, 'type:', typeof q.totalLaborHT, 'laborItems:', q.laborItems);

      // Convert to number and check if valid
      const laborTotal = Number(q.totalLaborHT);
      if (q.totalLaborHT && !isNaN(laborTotal) && laborTotal > 0) {
        console.log('Using pre-calculated totalLaborHT:', laborTotal);
        return sum + laborTotal;
      } else {
        console.log('Pre-calculated totalLaborHT failed condition:', {
          exists: !!q.totalLaborHT,
          convertedValue: laborTotal,
          isNaN: isNaN(laborTotal),
          greaterThanZero: laborTotal > 0,
          originalValue: q.totalLaborHT
        });
      }

      // Fallback: calculate from labor items
      if (q.laborItems && Array.isArray(q.laborItems) && q.laborItems.length > 0) {
        const calculatedTotal = q.laborItems.reduce((itemSum: number, item: any) => {
          const itemTotal = Number(item.totalPriceDollar) || 0;
          return itemSum + itemTotal;
        }, 0);
        console.log('Calculated labor total from items:', calculatedTotal);
        return sum + calculatedTotal;
      }

      console.log('No valid labor data for quote', q.id);
      return sum;
    }, 0);

    const totalRevenue = totalSupplies + totalLabor;
    const averageQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0;

    console.log('Final calculations for FILTERED quotes only:', {
      totalQuotes,
      totalSupplies,
      totalLabor,
      totalRevenue,
      averageQuoteValue
    });

    setFinancialSummary({
      totalQuotes,
      totalSupplies,
      totalLabor,
      totalRevenue,
      averageQuoteValue
    });
  };

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setSelectedPeriod(event.target.value);
    if (event.target.value !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
        <Container maxWidth="xl" className="financial-page">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography variant="h6">Chargement des données financières...</Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Container maxWidth="xl" className="financial-page">
        <Typography variant="h4" component="h1" className="page-title">
          Tableau de Bord Financier
        </Typography>


        {/* Search and Filter Section */}
        <Paper className="filter-section" elevation={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
            <Typography variant="h6" className="section-title">
              Filtres de Recherche
            </Typography>
                         <Button
               variant="outlined"
               startIcon={<RefreshIcon />}
                               onClick={async () => {
                  setIsLoading(true);
                  try {
                    const [fetchedQuotes] = await Promise.all([
                      apiService.getQuotes(),
                      loadAllItems()
                    ]);

                    const latestVersions = getLatestQuoteVersions(fetchedQuotes);

                    // Fetch supply items for each quote
                    const quotesWithItems = await Promise.all(
                      latestVersions.map(async (quote) => {
                        try {
                          const supplyItems = await apiService.getSupplyItems(quote.id);
                          return {
                            ...quote,
                            supplyItems: supplyItems
                          };
                        } catch (error) {
                          console.error(`Error fetching supply items for quote ${quote.id}:`, error);
                          return {
                            ...quote,
                            supplyItems: []
                          };
                        }
                      })
                    );

                    setQuotes(quotesWithItems);
                  } catch (error) {
                    console.error('Error refreshing data:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
               sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
             >
               Actualiser
             </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Recherche"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                                 placeholder="Client, Site, Objet, Équipement, Article..."
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Autocomplete
                fullWidth
                options={sites}
                value={selectedSite}
                onChange={(event, newValue) => {
                  setSelectedSite(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Site"
                    placeholder="Rechercher un site..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option === value}
                noOptionsText="Aucun site trouvé"
                clearOnEscape
                selectOnFocus
                handleHomeEndKeys
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Autocomplete
                fullWidth
                options={clients}
                value={selectedClient}
                onChange={(event, newValue) => {
                  setSelectedClient(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Client"
                    placeholder="Rechercher un client..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option === value}
                noOptionsText="Aucun client trouvé"
                clearOnEscape
                selectOnFocus
                handleHomeEndKeys
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Autocomplete
                fullWidth
                options={objects}
                value={selectedObject}
                onChange={(event, newValue) => {
                  setSelectedObject(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Objet"
                    placeholder="Rechercher un objet..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option === value}
                noOptionsText="Aucun objet trouvé"
                clearOnEscape
                selectOnFocus
                handleHomeEndKeys
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Autocomplete
                fullWidth
                options={equipment}
                value={selectedEquipment}
                onChange={(event, newValue) => {
                  setSelectedEquipment(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Équipement (Frigorifique)"
                    placeholder="Rechercher un équipement..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option === value}
                noOptionsText="Aucun équipement trouvé"
                clearOnEscape
                selectOnFocus
                handleHomeEndKeys
              />
            </Box>
             <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
               <Autocomplete
                 fullWidth
                 options={allItems}
                 getOptionLabel={(option) => option.description}
                 value={selectedItem}
                 onChange={(event, newValue) => {
                   setSelectedItem(newValue);
                 }}
                 renderInput={(params) => (
                   <TextField
                     {...params}
                     label="Article (Fourniture)"
                     placeholder="Rechercher un article..."
                     InputProps={{
                       ...params.InputProps,
                       startAdornment: (
                         <InputAdornment position="start">
                           <SearchIcon />
                         </InputAdornment>
                       ),
                     }}
                   />
                 )}
                 renderOption={(props, option) => (
                   <Box component="li" {...props}>
                     <Box>
                       <Typography variant="body1">{option.description}</Typography>
                       <Typography variant="caption" color="textSecondary">
                         ID: {option.id} | Prix: {option.priceEuro}€ | Stock: {option.quantity}
                       </Typography>
                     </Box>
                   </Box>
                 )}
                 renderTags={(value, getTagProps) =>
                   value.map((option, index) => (
                     <Chip
                       {...getTagProps({ index })}
                       key={option.id}
                       label={option.description}
                       size="small"
                     />
                   ))
                 }
                 isOptionEqualToValue={(option, value) => option.id === value?.id}
                 noOptionsText="Aucun article trouvé"
                 clearOnEscape
                 selectOnFocus
                 handleHomeEndKeys
               />
             </Box>
             <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
               <FormControl fullWidth>
                 <InputLabel>Période</InputLabel>
                 <Select
                   value={selectedPeriod}
                   label="Période"
                   onChange={handlePeriodChange}
                 >
                   <MenuItem value="all">Toutes les périodes</MenuItem>
                   <MenuItem value="today">Aujourd'hui</MenuItem>
                   <MenuItem value="week">Cette semaine</MenuItem>
                   <MenuItem value="month">Ce mois</MenuItem>
                   <MenuItem value="year">Cette année</MenuItem>
                   <MenuItem value="custom">Période personnalisée</MenuItem>
                 </Select>
               </FormControl>
             </Box>
            {selectedPeriod === 'custom' && (
              <>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date de début"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date de fin"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </>
            )}
          </Box>
        </Paper>

        {/* Financial Summary Cards */}
        <Box className="summary-cards" sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card className="summary-card total-quotes">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Devis
                </Typography>
                <Typography variant="h4" component="div">
                  {financialSummary.totalQuotes}
                </Typography>
                <TrendingUpIcon className="card-icon" />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card className="summary-card total-supplies">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Fournitures
                </Typography>
                <Typography variant="h4" component="div">
                  {formatCurrency(financialSummary.totalSupplies)}
                </Typography>
                <BuildIcon className="card-icon" />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card className="summary-card total-labor">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Main d'Oeuvre
                </Typography>
                <Typography variant="h4" component="div">
                  {formatCurrency(financialSummary.totalLabor)}
                </Typography>
                <BuildIcon className="card-icon" />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card className="summary-card total-revenue">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Revenu Total
                </Typography>
                <Typography variant="h4" component="div">
                  {formatCurrency(financialSummary.totalRevenue)}
                </Typography>
                <MoneyIcon className="card-icon" />
              </CardContent>
            </Card>
          </Box>
        </Box>

                {/* Quotes Table */}
        <Paper className="quotes-table-section" elevation={2}>
          <Typography variant="h6" className="section-title">
            Devis ({filteredQuotes.length})
          </Typography>
          {filteredQuotes.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" padding={4}>
              <Typography variant="body1" color="textSecondary">
                Aucun devis trouvé avec les filtres actuels
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID Devis</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Objet</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Fournitures</TableCell>
                    <TableCell align="right">Main d'Oeuvre</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                                     {filteredQuotes.map((quote) => {
                     // Calculate supplies total with fallback
                     let suppliesTotal = 0;
                     const convertedSuppliesTotal = Number(quote.totalSuppliesHT);
                     if (quote.totalSuppliesHT && !isNaN(convertedSuppliesTotal) && convertedSuppliesTotal > 0) {
                       suppliesTotal = convertedSuppliesTotal;
                     } else if (quote.supplyItems && Array.isArray(quote.supplyItems) && quote.supplyItems.length > 0) {
                       suppliesTotal = quote.supplyItems.reduce((sum: number, item: any) => {
                         return sum + (Number(item.totalPriceDollar) || 0);
                       }, 0);
                     }

                     // Calculate labor total with fallback
                     let laborTotal = 0;
                     const convertedLaborTotal = Number(quote.totalLaborHT);
                     if (quote.totalLaborHT && !isNaN(convertedLaborTotal) && convertedLaborTotal > 0) {
                       laborTotal = convertedLaborTotal;
                     } else if (quote.laborItems && Array.isArray(quote.laborItems)) {
                       laborTotal = quote.laborItems.reduce((sum: number, item: any) => {
                         return sum + (Number(item.totalPriceDollar) || 0);
                       }, 0);
                     }

                     // Calculate total HT
                     const totalHT = suppliesTotal + laborTotal;

                    return (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.id}</TableCell>
                        <TableCell>{quote.clientName}</TableCell>
                        <TableCell>{quote.siteName}</TableCell>
                        <TableCell>{quote.object}</TableCell>
                        <TableCell>{new Date(quote.date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell align="right">{formatCurrency(suppliesTotal)}</TableCell>
                        <TableCell align="right">{formatCurrency(laborTotal)}</TableCell>
                        <TableCell align="right">{formatCurrency(totalHT)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Bottom Total Section */}
        <Paper className="bottom-totals-section" elevation={3}>
          <Typography variant="h5" className="section-title">
            Résumé Financier
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Box className="total-box total-quotes-box">
                <Typography variant="h6">Total Devis</Typography>
                <Typography variant="h4">{financialSummary.totalQuotes}</Typography>
                <Typography variant="body2">Nombre total de devis</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Box className="total-box total-supplies-box">
                <Typography variant="h6">Total Fournitures</Typography>
                <Typography variant="h4">{formatCurrency(financialSummary.totalSupplies)}</Typography>
                <Typography variant="body2">Montant total des fournitures</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Box className="total-box total-labor-box">
                <Typography variant="h6">Total Main d'Oeuvre</Typography>
                <Typography variant="h4">{formatCurrency(financialSummary.totalLabor)}</Typography>
                <Typography variant="body2">Montant total de la main d'oeuvre</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

export default FinancialPage;


