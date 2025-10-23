import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
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
  MenuItem,
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { SupplyItem } from '../../models/Quote';
import { apiService } from '../../services/api-service';
import { calculateSupplyItemTotal } from '../../utils/calculations';
import CustomNumberInput from '../CustomNumberInput/CustomNumberInput';
import './SuppliesSection.scss';

interface SuppliesSectionProps {
  items?: SupplyItem[];
  description: string;
  exchangeRate: number;
  marginRate: number;
  totalHT: number;
  onAddItem: (item: Omit<SupplyItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateExchangeRate: (rate: number) => void;
  onUpdateMarginRate: (rate: number) => void;
  onUpdateSupplyItem: (item: SupplyItem) => void;
}

const SuppliesSection: React.FC<SuppliesSectionProps> = ({
  items = [],
  description,
  exchangeRate,
  marginRate,
  totalHT,
  onAddItem,
  onRemoveItem,
  onUpdateDescription,
  onUpdateExchangeRate,
  onUpdateMarginRate,
  onUpdateSupplyItem
}) => {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<SupplyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SupplyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<SupplyItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityInputValue, setQuantityInputValue] = useState<string>('1');
  const [customPriceDialogOpen, setCustomPriceDialogOpen] = useState(false);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editQuantityInputValue, setEditQuantityInputValue] = useState<string>('1');
  const [quantityWarningDialogOpen, setQuantityWarningDialogOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<SupplyItem | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number>(1);

  // Load catalog items on component mount
  useEffect(() => {
    const loadCatalogItems = async () => {
      try {
        setIsLoading(true);
        const loadedItems = await apiService.getSupplies();

        // Map API response to expected structure if needed
        const mappedItems = loadedItems.map(item => {
          const itemAny = item as any;
          const description = itemAny.description || itemAny.Description || itemAny.name || itemAny.Name || '';

          return {
            id: itemAny.id,
            item_id: itemAny.id, // Set item_id to the catalog item ID
            description: description,
            priceEuro: parseFloat(itemAny.price) || 0,
            quantity: itemAny.quantity !== undefined && itemAny.quantity !== null ? Number(itemAny.quantity) : 0,
            priceDollar: 0, // Will be calculated
            unitPriceDollar: 0, // Will be calculated
            totalPriceDollar: 0 // Will be calculated
          } as SupplyItem;
        });

        setCatalogItems(mappedItems);
        setFilteredItems(mappedItems);
      } catch (error) {
        console.error('Error loading catalog items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalogItems();
  }, []);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(catalogItems);
    } else {
      const filtered = catalogItems.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, catalogItems]);

  // Calculate dollar prices for all items when rates change
  useEffect(() => {
    const itemsWithDollarPrices = items.map(item =>
      calculateSupplyItemTotal(item, exchangeRate, marginRate)
    );
    // Update items with calculated dollar prices
    itemsWithDollarPrices.forEach(item => {
      const existingItem = items.find(i => i.id === item.id);
      if (existingItem) {
        existingItem.priceDollar = item.priceDollar;
        existingItem.unitPriceDollar = item.unitPriceDollar;
        existingItem.totalPriceDollar = item.totalPriceDollar;
      }
    });
  }, [items, exchangeRate, marginRate]);

  // Handle opening the search dialog
  const handleOpenSearchDialog = () => {
    setSearchDialogOpen(true);
    setSearchTerm('');
    setSelectedItem(null);
    setQuantity(1);
    setQuantityInputValue('1');
  };

  // Handle closing the search dialog
  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
  };

  // Handle selecting an item from the catalog
  const handleSelectItem = (item: SupplyItem) => {
    setSelectedItem(item);
  };

  // Handle closing the custom price dialog
  const handleCloseCustomPriceDialog = () => {
    setCustomPriceDialogOpen(false);
    setCustomPrice(0);
  };

  // Handle adding an item with custom price
  const handleAddItemWithCustomPrice = () => {
    if (selectedItem && customPrice > 0) {
      const itemWithCustomPrice = {
        ...selectedItem,
        priceEuro: customPrice
      };
      const calculatedItem = calculateSupplyItemTotal(itemWithCustomPrice, exchangeRate, marginRate);
      onAddItem({
        item_id: selectedItem.id, // Include catalog item ID for inventory tracking
        description: calculatedItem.description,
        quantity: Math.round(quantity), // Ensure quantity is an integer
        priceEuro: calculatedItem.priceEuro,
        priceDollar: calculatedItem.priceDollar,
        unitPriceDollar: calculatedItem.unitPriceDollar,
        totalPriceDollar: calculatedItem.totalPriceDollar,
        inventory_deducted: false // Mark as not yet deducted
      });
      handleCloseCustomPriceDialog();
    }
  };

  // Handle adding a regular item
  const handleAddItem = () => {
    if (selectedItem) {
      // Check if selected quantity exceeds available quantity
      if (quantity > selectedItem.quantity && selectedItem.quantity > 0) {
        setPendingItem(selectedItem);
        setPendingQuantity(quantity);
        setQuantityWarningDialogOpen(true);
        return;
      }

      // Proceed with adding item
      addItemToQuote(selectedItem, quantity);
    }
  };

  // Helper function to add item to quote
  const addItemToQuote = (item: SupplyItem, qty: number) => {
    const calculatedItem = calculateSupplyItemTotal(item, exchangeRate, marginRate);
    onAddItem({
      item_id: item.id, // Include catalog item ID for inventory tracking
      description: calculatedItem.description,
      quantity: Math.round(qty), // Ensure quantity is an integer
      priceEuro: calculatedItem.priceEuro,
      priceDollar: calculatedItem.priceDollar,
      unitPriceDollar: calculatedItem.unitPriceDollar,
      totalPriceDollar: calculatedItem.totalPriceDollar,
      inventory_deducted: false // Mark as not yet deducted
    });
    handleCloseSearchDialog();
  };

  // Handle quantity warning confirmation
  const handleQuantityWarningConfirm = () => {
    if (pendingItem) {
      addItemToQuote(pendingItem, pendingQuantity);
      setQuantityWarningDialogOpen(false);
      setPendingItem(null);
      setPendingQuantity(1);
    }
  };

  // Handle quantity warning cancel
  const handleQuantityWarningCancel = () => {
    setQuantityWarningDialogOpen(false);
    setPendingItem(null);
    setPendingQuantity(1);
  };

  const handleOpenEditPriceDialog = (item: SupplyItem) => {
    setEditingItem(item);
    setEditPrice(item.priceEuro);
    setEditQuantity(item.quantity);
    setEditQuantityInputValue(item.quantity.toString());
    setEditPriceDialogOpen(true);
  };

  const handleCloseEditPriceDialog = () => {
    setEditPriceDialogOpen(false);
    setEditingItem(null);
    setEditPrice(0);
    setEditQuantity(1);
    setEditQuantityInputValue('1');
  };

    // Handle quantity input change for search dialog
  const handleQuantityInputChange = (value: number) => {
    setQuantity(value);
    setQuantityInputValue(value.toString());
  };

  // Handle edit quantity input change
  const handleEditQuantityInputChange = (value: number) => {
    setEditQuantity(value);
    setEditQuantityInputValue(value.toString());
  };

  const handleUpdatePrice = () => {
    if (editingItem) {
      const updatedItem = {
        ...editingItem,
        priceEuro: editPrice,
        quantity: Math.round(editQuantity) // Ensure quantity is an integer
      };
      onUpdateSupplyItem(updatedItem);
      handleCloseEditPriceDialog();
    }
  };

  return (
    <Paper className="supplies-section" elevation={2}>
      <Typography variant="h6" className="section-title">
        FOURNITURES
      </Typography>

      <TextField
        select
        fullWidth
        label="Description des fournitures"
        value={description}
        onChange={(e) => onUpdateDescription(e.target.value)}
        variant="outlined"
        margin="none"
        className="description-field"
      >
        <MenuItem value="Extension des raccordements électriques, frigorifique et condensat">
          Extension des raccordements électriques, frigorifique et condensat
        </MenuItem>
        <MenuItem value="Installation complète du Split">
          Installation complète du Split
        </MenuItem>
        <MenuItem value="Livraison et pose du Split avec accessoires de raccordement">
          Livraison et pose du Split avec accessoires de raccordement
        </MenuItem>
        <MenuItem value="Fournitures Epa du calorifuger plus accessoires">
          Fournitures du calorifugeur plus accessoires
        </MenuItem>
        <MenuItem value="Fournitures et pose des pièces électriques et frigorifique">
          Fournitures et pose des pièces électriques et frigorifique
        </MenuItem>
        <MenuItem value="Fournitures et pose des pièces électriques">
          Fournitures et pose des pièces électriques
        </MenuItem>
        <MenuItem value="Fournitures et pose des pièces frigorifique">
          Fournitures et pose des pièces frigorifique
        </MenuItem>
        <MenuItem value="Réparation du Ventilo convecteur">
          Réparation du Ventilo convecteur
        </MenuItem>
      </TextField>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }} className="rates-container">
        <Box className="rates-container-item" sx={{ flex: '1 1 50px' }}>
          <CustomNumberInput
            value={exchangeRate}
            label="Taux de change"
            min={0}
            step={0.01}
            fullWidth
            onChange={onUpdateExchangeRate}
          />
        </Box>
        <Box className="rates-container-item" sx={{ flex: '1 1 50px' }}>
          <CustomNumberInput
            value={marginRate}
            label="Taux de marge"
            min={0}
            max={1}
            step={0.01}
            fullWidth
            onChange={onUpdateMarginRate}
          />
        </Box>
      </Box>

      <Box className="item-actions">
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenSearchDialog}
          className="add-item-button"
        >
          Ajouter un article
        </Button>
      </Box>

      <TableContainer className="items-table-container">
        <Table size="small" aria-label="supplies table">
          <TableHead>
            <TableRow>
              <TableCell>N°</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qté</TableCell>
              <TableCell align="right">PR €</TableCell>
              <TableCell align="right">PR $</TableCell>
              <TableCell align="right">PV/u $</TableCell>
              <TableCell align="right">PV $ Total HT</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucun article ajouté
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{Math.round(item.quantity)}</TableCell>
                  <TableCell align="right">{Number(item.priceEuro || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.priceDollar || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.unitPriceDollar || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.totalPriceDollar || 0).toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditPriceDialog(item)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveItem(item.id)}
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

      <Box className="total-container">
        <Typography variant="subtitle1" className="total-label">
          TOTAL FOURNITURE $ HT:
        </Typography>
        <Typography variant="subtitle1" className="total-value">
          {Number(totalHT ?? 0).toFixed(2)}
        </Typography>
      </Box>

      {/* Item Search Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={handleCloseSearchDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ajouter un article</DialogTitle>
        <DialogContent>
          <Box className="search-container">
            <TextField
              fullWidth
              label="Rechercher un article (nom ou ID)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: <SearchIcon color="action" />
              }}
            />
          </Box>

          <TableContainer className="search-results-container">
            <Table size="small">
                             <TableHead>
                 <TableRow>
                   <TableCell>Description</TableCell>
                   <TableCell align="right">Quantité</TableCell>
                   <TableCell align="right">Prix €</TableCell>
                   <TableCell align="center">Action</TableCell>
                 </TableRow>
               </TableHead>
              <TableBody>
                                 {filteredItems.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={4} align="center">
                       Aucun article trouvé
                     </TableCell>
                   </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className={selectedItem?.id === item.id ? 'selected-item' : ''}
                      onClick={() => handleSelectItem(item)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.description}
                          {item.quantity === 0 && (
                            <WarningIcon fontSize="small" color="warning" />
                          )}
                          {item.quantity < 5 && item.quantity > 0 && (
                            <Chip
                              label="Stock faible"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                          {Math.round(item.quantity)}
                          {item.quantity < 0 && (
                            <Chip
                              label="Stock négatif"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                       <TableCell align="right">{Number(item.priceEuro || 0).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleSelectItem(item)}
                        >
                          Sélectionner
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {selectedItem && (
            <Box className="quantity-container">
              <Typography variant="subtitle1">
                Article sélectionné: {selectedItem.description}
              </Typography>
                             <CustomNumberInput
                 label="Quantité"
                 value={quantity}
                 onChange={handleQuantityInputChange}
                 min={1}
                 step={1}
                 fullWidth
                 margin="normal"
                 displayAsInteger={true}
               />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSearchDialog} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleAddItem}
            color="primary"
            variant="contained"
            disabled={!selectedItem}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Price Dialog */}
      <Dialog
        open={customPriceDialogOpen}
        onClose={() => setCustomPriceDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Entrer un prix personnalisé</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            L'article "{selectedItem?.description}" a un prix de 0.00€.
            Veuillez entrer un prix personnalisé pour cet article.
          </Typography>
          <CustomNumberInput
            label="Prix (€)"
            value={customPrice}
            onChange={setCustomPrice}
            min={0.01}
            step={0.01}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomPriceDialogOpen(false)} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleAddItemWithCustomPrice}
            color="primary"
            variant="contained"
            disabled={customPrice <= 0}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Price Dialog */}
      <Dialog
        open={editPriceDialogOpen}
        onClose={handleCloseEditPriceDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Modifier le prix et la quantité</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Article: {editingItem?.description}
          </Typography>
          <CustomNumberInput
            label="Prix (€)"
            value={editPrice}
            onChange={setEditPrice}
            min={0.01}
            step={0.01}
            fullWidth
            margin="normal"
          />
                     <CustomNumberInput
             label="Quantité"
             value={editQuantity}
             onChange={handleEditQuantityInputChange}
             min={1}
             step={1}
             fullWidth
             margin="normal"
             displayAsInteger={true}
           />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditPriceDialog} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleUpdatePrice}
            color="primary"
            variant="contained"
            disabled={editPrice <= 0 || editQuantity < 1}
          >
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quantity Warning Dialog */}
      <Dialog
        open={quantityWarningDialogOpen}
        onClose={handleQuantityWarningCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Quantité insuffisante
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous avez sélectionné <strong>{pendingQuantity}</strong> unités de <strong>"{pendingItem?.description}"</strong>,
            mais seulement <strong>{pendingItem?.quantity}</strong> unités sont disponibles en stock.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Voulez-vous quand même ajouter cet article avec la quantité demandée ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQuantityWarningCancel} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleQuantityWarningConfirm}
            color="warning"
            variant="contained"
          >
            Ajouter quand même
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SuppliesSection;