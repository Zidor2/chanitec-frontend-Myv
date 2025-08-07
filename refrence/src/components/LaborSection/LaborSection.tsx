import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { LaborItem } from '../../models/Quote';
import { calculateLaborItemTotal } from '../../utils/calculations';
import CustomNumberInput from '../CustomNumberInput/CustomNumberInput';
import './LaborSection.scss';

interface LaborSectionProps {
  items?: LaborItem[];
  description: string;
  exchangeRate: number;
  marginRate: number;
  totalHT: number;
  onAddItem: (item: Omit<LaborItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateExchangeRate: (rate: number) => void;
  onUpdateMarginRate: (rate: number) => void;
}

const LaborSection: React.FC<LaborSectionProps> = ({
  items = [],
  description,
  exchangeRate,
  marginRate,
  totalHT,
  onAddItem,
  onRemoveItem,
  onUpdateDescription,
  onUpdateExchangeRate,
  onUpdateMarginRate
}) => {
  const [nbTechnicians, setNbTechnicians] = useState(1);
  const [nbHours, setNbHours] = useState(1);
  const [weekendMultiplier, setWeekendMultiplier] = useState(1);
  const [priceEuro, setPriceEuro] = useState(10);

  // Weekend multiplier options
  const weekendOptions = [
    { value: 1, label: '1 (Normal)' },
    { value: 1.6, label: '1.6 (Weekend)' }
  ];

  // Calculate dollar prices for all items when rates change
  useEffect(() => {
    const itemsWithDollarPrices = items.map(item =>
      calculateLaborItemTotal(item, exchangeRate, marginRate)
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

  // Handle adding a new labor item
  const handleAddLaborItem = () => {
    const newItem: Omit<LaborItem, 'id'> = {
      description,
      nbTechnicians,
      nbHours,
      weekendMultiplier,
      priceEuro
    };
    const calculatedItem = calculateLaborItemTotal(newItem as LaborItem, exchangeRate, marginRate);
    onAddItem({
      ...calculatedItem
    });

    // Reset form fields
    setNbTechnicians(1);
    setNbHours(1);
    setWeekendMultiplier(1);
    setPriceEuro(10);
  };

  return (
    <Paper className="labor-section" elevation={2}>
      <Typography variant="h6" className="section-title">
        MAIN D'OEUVRE
      </Typography>

      <TextField
        select
        fullWidth
        label="Description de la main d'oeuvre"
        value={description}
        onChange={(e) => onUpdateDescription(e.target.value)}
        variant="outlined"
        margin="normal"
        className="description-field"
      >
        <MenuItem value="Fixation, mise au point, raccordement, mise en vide et mise en service En weekend">
          Fixation, mise au point, raccordement, mise en vide et mise en service En weekend
        </MenuItem>
        <MenuItem value="Fixation, mise au point, raccordement, mise en vide et mise en service ">
          Fixation, mise au point, raccordement, mise en vide et mise en service
        </MenuItem>
      </TextField>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems:  'right' , gap: 5 }} className="rates-container">
        <Box className="rates-container-item" sx={{ flex: '1 1 50px', width: '50%'}}>
          <CustomNumberInput
            label="Taux de change"
            value={exchangeRate}
            min={0}
            step={0.01}
            onChange={onUpdateExchangeRate}
          />
        </Box>
        <Box className="rates-container-item" sx={{ flex: '1 1 50px' , width: '50%' }}>
          <CustomNumberInput
            label="Taux de marge"
            value={marginRate}
            min={0}
            max={1}
            step={0.01}
            onChange={onUpdateMarginRate}
          />
        </Box>
      </Box>

      <Paper className="add-labor-form" elevation={1}>
        <Typography variant="subtitle1" gutterBottom>
          Ajouter Main d'oeuvre
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 220px' }}>
            <CustomNumberInput
              label="Nb technicien"
              value={nbTechnicians}
              onChange={(value) => setNbTechnicians(value)}
              min={1}
              step={1}
              fullWidth
            />
          </Box>

          <Box sx={{ flex: '1 1 220px' }}>
            <CustomNumberInput
              label="Nb heures"
              value={nbHours}
              onChange={(value) => setNbHours(value)}
              min={1}
              step={1}
              fullWidth
            />
          </Box>

          <Box sx={{ flex: '1 1 220px' }}>
            <TextField
              select
              fullWidth
              label="Majo Weekend"
              value={weekendMultiplier}
              onChange={(e) => setWeekendMultiplier(parseFloat(e.target.value))}
              variant="outlined"
              margin="dense"
            >
              {(weekendOptions ?? []).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ flex: '1 1 220px' }}>
            <CustomNumberInput
              label="PR €"
              value={priceEuro}
              onChange={(value) => setPriceEuro(value)}
              min={0}
              step={0.01}
              fullWidth
            />
          </Box>
        </Box>

        <Box className="add-button-container">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddLaborItem}
            className="add-labor-button"
          >
            Ajouter
          </Button>
        </Box>
      </Paper>

      <TableContainer className="items-table-container">
        <Table size="small" aria-label="labor table">
          <TableHead>
            <TableRow>
              <TableCell>Nb technicien</TableCell>
              <TableCell>Nb heures</TableCell>
              <TableCell>Majo Weekend</TableCell>
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
                  Aucun élément de main d'oeuvre ajouté
                </TableCell>
              </TableRow>
            ) : (
              (items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nbTechnicians}</TableCell>
                  <TableCell>{item.nbHours}</TableCell>
                  <TableCell>{item.weekendMultiplier}</TableCell>
                  <TableCell align="right">{Number(item.priceEuro ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.priceDollar ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.unitPriceDollar ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.totalPriceDollar ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="center">
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
          TOTAL MAIN D'OEUVRE $ HT:
        </Typography>
        <Typography variant="subtitle1" className="total-value">
          {Number(totalHT ?? 0).toFixed(2)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default LaborSection;