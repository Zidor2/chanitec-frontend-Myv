import React from 'react';
import {
  Box,
  Button,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';
import {
  SaveOutlined,
  GetApp as DownloadIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { useQuote } from '../../contexts/QuoteContext';
import CustomNumberInput from '../CustomNumberInput/CustomNumberInput';
import './QuoteActions.scss';

interface QuoteActionsProps {
  clientName: string;
  siteName: string;
  date: string;
  isExistingQuote: boolean;
  onSave: (remiseValue?: number) => Promise<boolean>;
  onUpdate?: (remiseValue?: number) => Promise<boolean>;
  onViewHistory: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
  onPrint: () => void;
  onDownloadPDF: () => void;
}

const QuoteActions: React.FC<QuoteActionsProps> = ({
  clientName,
  siteName,
  date,
  isExistingQuote,
  onSave,
  onUpdate,
  onViewHistory,
  contentRef,
  onPrint,
  onDownloadPDF
}) => {
  const { state, setQuoteField, clearQuote, createNewQuote, updateRemise } = useQuote();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  // Remise dialog state
  const [remiseDialogOpen, setRemiseDialogOpen] = React.useState(false);
  const [remiseEnabled, setRemiseEnabled] = React.useState(false);
  const [remiseValue, setRemiseValue] = React.useState(0);



  // Handle save action
  const handleSave = async () => {
    // Validate that client and site are selected
    if (!clientName || !siteName || clientName.trim() === '' || siteName.trim() === '') {
      alert('Veuillez sélectionner un client et un site avant d\'enregistrer le devis.');
      setSnackbarMessage('Veuillez sélectionner un client et un site avant d\'enregistrer le devis.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Initialize remise dialog with current values from the quote state
    const currentRemise = state.currentQuote?.remise || 0;
    setRemiseEnabled(currentRemise > 0);
    setRemiseValue(currentRemise);

    // Open remise dialog
    setRemiseDialogOpen(true);
  };

  // Handle actual save with remise
  const handleSaveWithRemise = async () => {
    try {
      // Set the remise value in the quote if enabled
      if (remiseEnabled) {
        updateRemise(remiseValue);
      } else {
        updateRemise(0);
      }

      // Use onSave for both new quotes and updates since they do the same thing
      // Pass the remise value directly to avoid race condition
      const success = await onSave(remiseEnabled ? remiseValue : 0);

      if (success) {
        const message = isExistingQuote
          ? 'Devis mis à jour avec succès! Prêt pour un nouveau devis.'
          : 'Devis enregistré avec succès! Prêt pour un nouveau devis.';
        setSnackbarMessage(message);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Close the remise dialog first
        setRemiseDialogOpen(false);

        // Wait a bit for the state to update before clearing
        setTimeout(() => {
          clearQuote();
          createNewQuote();
          window.location.href = '/quote';
        }, 100);
      } else {
        const errorMessage = isExistingQuote
          ? 'Erreur lors de la mise à jour du devis.'
          : 'Erreur lors de l\'enregistrement du devis.';
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      const errorMessage = isExistingQuote
        ? 'Erreur lors de la mise à jour du devis.'
        : 'Erreur lors de l\'enregistrement du devis.';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle save and print action
  const handleSaveAndPrint = async () => {
    // Validate that client and site are selected
    if (!clientName || !siteName || clientName.trim() === '' || siteName.trim() === '') {
      alert('Veuillez sélectionner un client et un site avant d\'enregistrer le devis.');
      setSnackbarMessage('Veuillez sélectionner un client et un site avant d\'enregistrer le devis.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // First save the quote if it doesn't exist
      if (!isExistingQuote) {
        const success = await onSave();
        if (!success) {
          setSnackbarMessage('Erreur lors de l\'enregistrement du devis.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
        setSnackbarMessage('Devis enregistré avec succès!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }

      // Then proceed with print functionality
      onPrint();
    } catch (error) {
      setSnackbarMessage('Erreur lors de l\'enregistrement du devis.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };





  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Handle remise checkbox change
  const handleRemiseCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRemiseEnabled(event.target.checked);
    if (!event.target.checked) {
      setRemiseValue(0);
    }
  };

  // Handle remise value change
  const handleRemiseValueChange = (value: number) => {
    setRemiseValue(value);
  };

  // Close remise dialog
  const handleCloseRemiseDialog = () => {
    setRemiseDialogOpen(false);
    setRemiseEnabled(false);
    setRemiseValue(0);
  };

  return (
    <Paper className="quote-actions" elevation={2}>
      <Box className="actions-container">
        {isExistingQuote ? (
          <Button
            variant="contained"
            color="primary"
            className="action-button update-button"
            startIcon={<UpdateIcon />}
            onClick={handleSave}
          >
            Mettre à jour
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            className="action-button save-button"
            startIcon={<SaveOutlined />}
            onClick={handleSave}
          >
            Enregistrer
          </Button>
        )}

        <Button
          variant="contained"
          color="info"
          className="action-button download-button"
          startIcon={<DownloadIcon />}
          onClick={handleSaveAndPrint}
        >
          Enregistrer sous
        </Button>
      </Box>

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

      {/* Remise Dialog */}
      <Dialog open={remiseDialogOpen} onClose={handleCloseRemiseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isExistingQuote ? 'Configuration de la Remise - Mise à jour' : 'Configuration de la Remise - Nouveau devis'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={remiseEnabled}
                  onChange={handleRemiseCheckboxChange}
                />
              }
              label="Remise"
            />
            {remiseEnabled && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CustomNumberInput
                  label="Pourcentage de remise"
                  value={remiseValue}
                  onChange={handleRemiseValueChange}
                  min={0}
                  max={100}
                  step={1}
                  displayAsInteger={true}
                />
                <Typography variant="body1">%</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemiseDialog} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSaveWithRemise} color="primary" variant="contained">
            {isExistingQuote ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default QuoteActions;