import React, { useState, useEffect, useRef, FC } from 'react';
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
  Tooltip,
  Snackbar,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Slider,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileUpload as FileUploadIcon,
  WarningAmber as WarningAmberIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import Layout from '../../components/Layout/Layout';
import { SupplyItem } from '../../models/Quote';
import { itemsApi } from '../../services/api';
import './ItemsPage.scss';
import { v4 as uuidv4 } from 'uuid';
import CustomNumberInput from '../../components/CustomNumberInput/CustomNumberInput';
const API_BASE_URL = process.env.REACT_APP_API_URL;


interface ItemsPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface ExcelItem {
  Description: string;
  price: number;
}

interface ProcessedItem {
  valid: boolean;
  rowIndex: number;
  item?: {
    description: string;
    priceEuro: number;
  };
  error?: string;
  rawData?: any;
}

interface ImportResultItem {
  rowIndex: number;
  item?: any;
  error?: string;
  rawData?: any;
}

interface ImportSummary {
  total: number;
  valid: number;
  invalid: number;
  imported: number;
  errors: number;
}

interface ImportResults {
  totalProcessed: number;
  successful: ImportResultItem[];
  failed: ImportResultItem[];
  summary: ImportSummary;
}

interface ProcessedExcelItem {
  description: string;
  priceEuro: number;
  quantity: number;
  rowIndex: number;
  isValid: boolean;
  validationError?: string;
  originalRow: {
    description: any;
    quantity: any;
    price: any;
  };
}

// Add type for worksheet with index signature
interface ExtendedWorksheet {
  [key: string]: any;
  '!ref'?: string;
}

// Add type for cell address
interface CellAddress {
  r: number;
  c: number;
}

const ItemsPage: FC<ItemsPageProps> = ({ currentPath, onNavigate }) => {
  // State for items data
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SupplyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // State for filters
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<SupplyItem>>({
    description: '',
    priceEuro: 0,
    quantity: 0
  });

  // State for loading and feedback
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // State for file import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for loading
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load items when component mounts
  useEffect(() => {
    loadItems();
  }, []);

  // Filter items when search term or filters change
  useEffect(() => {
    filterItems();
  }, [searchTerm, items, quantityFilter, priceRange]);

  // Load all items from API
  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemsApi.getAllItems();

      // Transform the data to match our frontend structure
      const transformedItems = data.map((item: any) => ({
        id: item.id,
        description: item.description,
        priceEuro: item.price,
        quantity: item.quantity
      }));

      setItems(transformedItems);
      setFilteredItems(transformedItems);
    } catch (error) {
      console.error('Error loading items:', error);
      showSnackbar('Erreur lors du chargement des articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search term and filters
  const filterItems = () => {
    let filtered = [...items];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Quantity filter
    if (quantityFilter === 'zero') {
      filtered = filtered.filter(item => item.quantity === 0);
    }

    // Price range filter
    filtered = filtered.filter(item =>
      item.priceEuro >= priceRange[0] && item.priceEuro <= priceRange[1]
    );

    setFilteredItems(filtered);
  };

  // Show snackbar with message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setQuantityFilter('all');
    setPriceRange([0, 1000]);
  };

  // Open dialog to add a new item
  const handleAddItem = () => {
    setCurrentItem({
      description: '',
      priceEuro: 0,
      quantity: 0
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle input change in dialog
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: name === 'priceEuro' ? parseFloat(value) : name === 'quantity' ? (value === '' ? 0 : parseInt(value)) : value
    });
  };

  // Save item (create or update)
  const handleSaveItem = async () => {
    if (!currentItem.description) {
      showSnackbar('La description est requise', 'error');
      return;
    }

    try {
      setLoading(true);
      const itemData = {
        description: currentItem.description,
        price: currentItem.priceEuro,
        quantity: currentItem.quantity === undefined || currentItem.quantity === null ? 0 : currentItem.quantity
      };

      if (isEditing && currentItem.id) {
        await itemsApi.updateItem(currentItem.id, itemData);
      } else {
        await itemsApi.createItem(itemData);
      }

      showSnackbar(`Article ${isEditing ? 'mis à jour' : 'créé'} avec succès`, 'success');
      handleCloseDialog();
      await loadItems();
    } catch (error) {
      showSnackbar(`Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} de l'article`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        setDeletingId(id);
        await itemsApi.deleteItem(id);
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        setFilteredItems(prevItems => prevItems.filter(item => item.id !== id));
        showSnackbar('Article supprimé avec succès', 'success');
      } catch (error) {
        showSnackbar('Erreur lors de la suppression de l\'article', 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Add this new function after handleSaveItem
  const handleImportItems = async (items: { description: string; priceEuro: number }[]) => {
    const results = {
      successful: [] as any[],
      failed: [] as any[],
      total: items.length,
      imported: 0
    };

    try {
      setLoading(true);

      // Process each item one by one
      for (const item of items) {
        try {
          // Validate item
          if (!item.description) {
            results.failed.push({
              item,
              error: 'La description est requise'
            });
            continue;
          }

          // Prepare item data (same structure as handleSaveItem)
          const itemData = {
            description: item.description,
            price: item.priceEuro,
            quantity: 0 // Default quantity for import
          };

          // Create item using the same API call as handleSaveItem
          const response = await itemsApi.createItem(itemData);

          results.successful.push({
            original: item,
            created: response
          });
          results.imported++;

          // Show progress
          showSnackbar(
            `Import en cours: ${results.imported}/${items.length} articles traités...`,
            'info'
          );
        } catch (error) {
          results.failed.push({
            item,
            error: `Erreur: ${(error as Error).message}`
          });
        }
      }

      // Show final results
      if (results.failed.length > 0) {
        if (results.successful.length > 0) {
          showSnackbar(
            `Import partiel: ${results.successful.length} articles importés, ${results.failed.length} échecs`,
            'warning' as const
          );
        } else {
          showSnackbar('Échec de l\'import: aucun article importé', 'error');
        }
        console.error('Failed imports:', results.failed);
      } else {
        showSnackbar(`${results.successful.length} articles importés avec succès`, 'success');
      }

      // Refresh the list
      await loadItems();
    } catch (error) {
      console.error('Error during import:', error);
      showSnackbar('Erreur lors de l\'import', 'error');
    } finally {
      setLoading(false);
    }

    return results;
  };

  // Update handleFileUpload function
  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = async (event: ProgressEvent<FileReader>) => {
        try {
          const data = event.target?.result;
          if (typeof data !== 'string') {
            throw new Error('Invalid file data');
          }

          // Read the Excel file
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert worksheet to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Skip header row and process data
          const processedItems: ProcessedExcelItem[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || row.length < 4) continue;

            const description = String(row[1] || '').trim(); // Column B
            if (!description) continue;

            let quantity = 0;
            const quantityValue = row[2]; // Column C
            if (typeof quantityValue === 'number') {
              quantity = Math.max(0, Math.floor(quantityValue));
            } else if (typeof quantityValue === 'string') {
              const cleanQuantity = quantityValue.replace(/[^0-9]/g, '');
              quantity = parseInt(cleanQuantity) || 0;
            }

            let price = 0;
            const priceValue = row[3]; // Column D
            if (typeof priceValue === 'number') {
              price = priceValue;
            } else if (typeof priceValue === 'string') {
              const cleanPrice = priceValue.replace(/[^0-9.,]/g, '').replace(',', '.');
              price = parseFloat(cleanPrice);
              if (isNaN(price)) price = 0;
            }

            const processedItem: ProcessedExcelItem = {
              description,
              priceEuro: price,
              quantity: quantity,
              rowIndex: i + 1,
              isValid: true,
              originalRow: {
                description: row[1],
                quantity: row[2],
                price: row[3]
              }
            };

            processedItems.push(processedItem);
          }

          if (processedItems.length > 0) {
            // Save each processed item individually
            let successCount = 0;
            let errorCount = 0;

            for (const item of processedItems) {
              try {
                // Create a new item using the API
                const response = await fetch(`${API_BASE_URL}/items`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    description: item.description,
                    price: item.priceEuro,
                    quantity: item.quantity
                  })
                });

                if (!response.ok) {
                  throw new Error(`Failed to save item: ${response.statusText}`);
                }

                await response.json();
                successCount++;
              } catch (error) {
                errorCount++;
              }
            }

            // Show final summary
            showSnackbar(
              `Import terminé: ${successCount} articles importés avec succès, ${errorCount} erreurs`,
              successCount > 0 ? 'success' : 'error'
            );

            // Refresh the items list
            await loadItems();
          }

        } catch (error) {
          showSnackbar(
            'Erreur lors du traitement du fichier: ' + (error as Error).message,
            'error'
          );
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      showSnackbar(
        'Erreur lors de la lecture du fichier: ' + (error as Error).message,
        'error'
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate}>
      <Box className="items-page">
        {/* Header Section */}
        <Box className="page-header">
          <Container maxWidth="lg">
            <Box className="header-content">
              <Box className="header-left">
                <Typography variant="h6" className="item-count">
                  ({filteredItems.length} articles)
                </Typography>
                <Box className="search-container">
                  <SearchIcon className="search-icon" />
                  <TextField
                    placeholder="Rechercher un article"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="small"
                    className="search-input"
                  />
                </Box>
              </Box>
              <Box className="header-actions">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  disabled={loading}
                  className="add-item-btn"
                >
                  Ajouter un article
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<FileUploadIcon />}
                  endIcon={<KeyboardArrowDownIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="import-excel-btn"
                >
                  Importer Excel
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
                <FormControl size="small" className="quantity-filter">
                  <InputLabel>Quantité:</InputLabel>
                  <Select
                    value={quantityFilter}
                    onChange={(e) => setQuantityFilter(e.target.value)}
                    label="Quantité:"
                  >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="zero">Quantité 0</MenuItem>
                  </Select>
                </FormControl>
                <Box className="price-filter">
                  <Typography variant="body2" className="price-label">
                    Prix:
                  </Typography>
                  <Slider
                    value={priceRange}
                    onChange={(_, newValue) => setPriceRange(newValue as [number, number])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    className="price-slider"
                  />
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                X Effacer les filtres
              </Button>
            </Box>
          </Box>

          {/* Items Table */}
          <Box className="items-table-section">

            <TableContainer className="items-table-container">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="table-header">DESCRIPTION</TableCell>
                    <TableCell className="table-header" align="right">PRIX (€)</TableCell>
                    <TableCell className="table-header" align="right">QUANTITÉ</TableCell>
                    <TableCell className="table-header" align="center">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" className="loading-cell">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" className="empty-cell">
                        Aucun article trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="table-row">
                        <TableCell className="description-cell">
                          {item.description}
                          {item.quantity === 0 && (
                            <Tooltip title="Quantité nulle : veuillez réapprovisionner" placement="right">
                              <WarningAmberIcon className="warning-icon" fontSize="small" />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell align="right" className="price-cell">
                          {item.priceEuro ? Number(item.priceEuro).toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell align="right" className="quantity-cell">
                          {item.quantity !== undefined && item.quantity !== null ? item.quantity : 0}
                        </TableCell>
                        <TableCell align="center" className="actions-cell">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setCurrentItem(item);
                              setIsEditing(true);
                              setDialogOpen(true);
                            }}
                            className="edit-btn"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deletingId === item.id}
                            className="delete-btn"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Container>
      </Box>

      {/* Dialog for adding/editing items */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Modifier l\'article' : 'Ajouter un nouvel article'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={currentItem.description}
            onChange={handleInputChange}
          />
          <CustomNumberInput
            label="Prix (€)"
            value={currentItem.priceEuro || 0}
            onChange={(value) => setCurrentItem({ ...currentItem, priceEuro: value })}
            step={0.01}
            min={0}
            fullWidth
            margin="dense"
            variant="outlined"
          />
          <CustomNumberInput
            label="Quantité"
            value={currentItem.quantity ?? 0}
            onChange={(value) => setCurrentItem({ ...currentItem, quantity: value })}
            step={1}
            min={0}
            fullWidth
            margin="dense"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSaveItem} color="primary" variant="contained" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
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

export default ItemsPage;