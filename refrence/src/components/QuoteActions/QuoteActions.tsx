import React from 'react';
import { Box, Button, Paper, Snackbar, Alert } from '@mui/material';
import {
  SaveOutlined,
  PrintOutlined,
  GetApp as DownloadIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { usePDF } from 'react-to-pdf';
import { apiService } from '../../services/api-service';
import { useQuote } from '../../contexts/QuoteContext';
import './QuoteActions.scss';

interface QuoteActionsProps {
  clientName: string;
  siteName: string;
  date: string;
  isExistingQuote: boolean;
  onSave: () => Promise<boolean>;
  onUpdate?: () => Promise<boolean>;
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
  const { state, saveQuote, updateQuote, setQuoteField, clearQuote, createNewQuote } = useQuote();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  // Setup PDF generation
  const { toPDF, targetRef } = usePDF({
    filename: generatePdfFilename(),
    page: {
      format: 'A4',
      margin: 0
    },
    method: 'open',
    canvas: {
      mimeType: 'image/png',
      qualityRatio: 1
    }
  });

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

    try {
      const success = await onSave();

      if (success) {
        setSnackbarMessage('Devis enregistré avec succès! Prêt pour un nouveau devis.');
        setSnackbarSeverity('success');

        alert('Devis enregistré avec succès! Prêt pour un nouveau devis.');
      } else {
        setSnackbarMessage('Erreur lors de l\'enregistrement du devis.');
        setSnackbarSeverity('error');
      }

      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Erreur lors de l\'enregistrement du devis.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    clearQuote();
    createNewQuote();
    // Navigation will be handled by the parent component

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

  // Handle update action
  const handleUpdate = async () => {
    try {
      const currentQuoteInfo = {
        id: state.currentQuote?.id || '',
        clientName: state.currentQuote?.clientName || '',
        siteName: state.currentQuote?.siteName || '',
        object: state.currentQuote?.object || '',
        date: state.currentQuote?.date || '',
        supplyDescription: state.currentQuote?.supplyDescription || '',
        laborDescription: state.currentQuote?.laborDescription || '',
        supplyExchangeRate: state.currentQuote?.supplyExchangeRate || 0,
        supplyMarginRate: state.currentQuote?.supplyMarginRate || 0,
        laborExchangeRate: state.currentQuote?.laborExchangeRate || 0,
        laborMarginRate: state.currentQuote?.laborMarginRate || 0,
        supplyItems: state.currentQuote?.supplyItems || [],
        laborItems: state.currentQuote?.laborItems || [],
        totalSuppliesHT: state.currentQuote?.totalSuppliesHT || 0,
        totalLaborHT: state.currentQuote?.totalLaborHT || 0,
        totalHT: state.currentQuote?.totalHT || 0,
        tva: state.currentQuote?.tva || 0,
        totalTTC: state.currentQuote?.totalTTC || 0,
        createdAt: state.currentQuote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmed: false,
        reminderDate: null
      };

      const originalQuote = await apiService.getQuoteById(currentQuoteInfo.id);
      const hasChanges = JSON.stringify(currentQuoteInfo) !== JSON.stringify(originalQuote);

      if (hasChanges) {
        const currentId = currentQuoteInfo.id;
        const parts = currentId.split('-');
        const version = parseInt(parts[2]) + 1;
        const newId = `${parts[0]}-${parts[1]}-${version}`;

        const updatedQuote = {
          ...currentQuoteInfo,
          id: newId,
          updatedAt: new Date().toISOString()
        };

        alert(`About to send the following payload to the database:\n\n${JSON.stringify(updatedQuote, null, 2)}`);

        const success = await updateQuote();

        if (success) {
          setSnackbarMessage('Devis mis à jour avec succès! Prêt pour un nouveau devis.');
          setSnackbarSeverity('success');
          clearQuote();
          createNewQuote();
          alert('Devis mis à jour avec succès! Prêt pour un nouveau devis.');
        } else {
          throw new Error('Failed to update quote');
        }
      } else {
        alert('No changes detected in the quote');
      }

      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Erreur lors de la mise à jour du devis.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Generate PDF filename
  function generatePdfFilename() {
    const formattedDate = date ? format(new Date(date), 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy');
    const cleanClientName = (clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '-');
    const cleanSiteName = (siteName || 'Site').replace(/[^a-zA-Z0-9]/g, '-');

    return `${cleanClientName}-${cleanSiteName}-${formattedDate}.pdf`;
  }

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (contentRef.current) {
      // Add pdf-print-mode class to apply print styling
      contentRef.current.classList.add('pdf-print-mode');

      // Force a reflow to ensure styles are applied
      const reflow = contentRef.current.offsetHeight;
      void reflow;

      // Use the ref from props instead of the one from usePDF
      targetRef.current = contentRef.current;

      // Generate PDF after a small delay to ensure styles are applied
      setTimeout(() => {
        toPDF();

        // Remove the class after PDF generation
        setTimeout(() => {
          contentRef.current?.classList.remove('pdf-print-mode');
        }, 1000);
      }, 100);

      setSnackbarMessage('PDF téléchargé avec succès!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  };

  // Handle print action using browser print functionality
  const handlePrint = () => {
    if (contentRef.current) {
      // Instead of opening a new window, trigger the browser's native print dialog
      // This way, all print media queries will be applied
      window.print();
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
    </Paper>
  );
};

export default QuoteActions;