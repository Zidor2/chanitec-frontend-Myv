import React, { useRef, useEffect, useState } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import Layout from '../../components/Layout/Layout';
import QuoteHeader from '../../components/QuoteHeader/QuoteHeader';
import SuppliesSection from '../../components/SuppliesSection/SuppliesSection';
import LaborSection from '../../components/LaborSection/LaborSection';
import TotalSection from '../../components/TotalSection/TotalSection';
import QuoteActions from '../../components/QuoteActions/QuoteActions';
import { useQuote } from '../../contexts/QuoteContext';
import './QuotePage.scss';
import logo from '../../logo.png';
import { useLocation } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { apiService } from '../../services/api-service';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

interface QuotePageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

const QuotePage: React.FC<QuotePageProps> = ({ currentPath, onNavigate, onLogout }) => {
  const {
    state,
    createNewQuote,
    saveQuote,
    updateQuote,
    setQuoteField,
    addSupplyItem,
    removeSupplyItem,
    addLaborItem,
    removeLaborItem,
    clearQuote,
    loadQuote,
    updateSupplyItem
  } = useQuote();

  const { currentQuote, isLoading, isExistingQuote } = state;
  const contentRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const location = useLocation();
  const quoteId = new URLSearchParams(location.search).get('id');

  const [isFromHistory, setIsFromHistory] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [numberChanitec, setNumberChanitec] = useState(currentQuote?.number_chanitec || '');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Load quote if ID is provided in URL
  useEffect(() => {
    if (quoteId && !isLoading && (!currentQuote || currentQuote.id !== quoteId)) {
      const queryParams = new URLSearchParams(window.location.search);
      const fromHistory = queryParams.get('fromHistory') === 'true';
      // Fetch createdAt for the quoteId
      const fetchAndLoad = async () => {
        try {
          const allQuotes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/quotes`).then(res => res.json());
          const found = allQuotes.find((q: any) => q.id === quoteId);
          if (found) {
            loadQuote(quoteId, found.createdAt, fromHistory);
          }
        } catch (e) {
          // fallback: try to load with empty createdAt
          loadQuote(quoteId, '', fromHistory);
        }
      };
      fetchAndLoad();
    }
  }, [quoteId, isLoading, loadQuote, currentQuote]);

  // Create a new quote if none exists and we're not loading one
  useEffect(() => {
    if (!currentQuote && !isLoading && !quoteId) {
      createNewQuote();
    }
  }, [currentQuote, isLoading, createNewQuote, quoteId]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const fromHistory = queryParams.get('fromHistory') === 'true';
    const confirmed = queryParams.get('confirmed') === 'true';
    const showConfirmParam = queryParams.get('showConfirm') === 'true';
    setIsFromHistory(fromHistory);
    setIsConfirmed(confirmed);
    setShowConfirm(showConfirmParam);
  }, []);

  // Update isConfirmed when currentQuote changes
  useEffect(() => {
    if (currentQuote) {
      setIsConfirmed(currentQuote.confirmed || false);
      setNumberChanitec(currentQuote.number_chanitec || '');
    }
  }, [currentQuote]);

  // Handle home button click
  const handleHomeClick = () => {
    if (currentPath === '/') {
      clearQuote();
    }
    onNavigate('/');
  };

  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleSaveConfirm = async () => {
    if (!currentQuote) return;
    if (!numberChanitec) {
      alert('Veuillez saisir le numéro CHANitec.');
      return;
    }
    try {
      const response = await apiService.confirmQuote(currentQuote.id, true, numberChanitec);
      setIsConfirmed(true);
      setConfirmDialogOpen(false);
      alert(response.message || 'Devis confirmé avec succès');
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('400')) {
        alert('Requête invalide : le champ "confirmed" doit être un booléen ou le numéro CHANitec est manquant.');
      } else if (error instanceof Error && error.message.includes('404')) {
        alert('Devis introuvable.');
      } else {
        alert('Erreur lors de la confirmation du devis. Veuillez réessayer.');
      }
      console.error('Error confirming quote:', error);
    }
  };

  // If no quote is loaded or is still loading, show loading
  if (!currentQuote || isLoading) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} onHomeClick={handleHomeClick}>
        <Box className="page-header">
          <Typography variant="h6" component="h1" className="page-title">
            CALCUL DE PRIX OFFRE CLIMATISATION
          </Typography>
        </Box>
        <Box className="loading-container">
          <Typography variant="h6">Chargement...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} onHomeClick={handleHomeClick}>

      <Container ref={contentRef} className="quote-content">
        <QuoteHeader
          quoteId={currentQuote.id}
          clientName={currentQuote.clientName}
          siteName={currentQuote.siteName}
          object={currentQuote.object}
          date={currentQuote.date}
          onClientChange={(value) => setQuoteField('clientName', value)}
          onSiteChange={(value) => setQuoteField('siteName', value)}
          onObjectChange={(value) => setQuoteField('object', value)}
          onDateChange={(value) => setQuoteField('date', value)}

        />

        <SuppliesSection
          items={currentQuote.supplyItems}
          description={currentQuote.supplyDescription}
          exchangeRate={currentQuote.supplyExchangeRate}
          marginRate={currentQuote.supplyMarginRate}
          totalHT={currentQuote.totalSuppliesHT}
          onAddItem={addSupplyItem}
          onRemoveItem={removeSupplyItem}
          onUpdateDescription={(value) => setQuoteField('supplyDescription', value)}
          onUpdateExchangeRate={(value) => setQuoteField('supplyExchangeRate', value)}
          onUpdateMarginRate={(value) => setQuoteField('supplyMarginRate', value)}
          onUpdateSupplyItem={updateSupplyItem}
        />

        <LaborSection
          items={currentQuote.laborItems}
          description={currentQuote.laborDescription}
          exchangeRate={currentQuote.laborExchangeRate}
          marginRate={currentQuote.laborMarginRate}
          totalHT={currentQuote.totalLaborHT}
          onAddItem={addLaborItem}
          onRemoveItem={removeLaborItem}
          onUpdateDescription={(value) => setQuoteField('laborDescription', value)}
          onUpdateExchangeRate={(value) => setQuoteField('laborExchangeRate', value)}
          onUpdateMarginRate={(value) => setQuoteField('laborMarginRate', value)}
        />

        <TotalSection
          totalSuppliesHT={currentQuote.totalSuppliesHT}
          totalLaborHT={currentQuote.totalLaborHT}
          totalHT={currentQuote.totalHT}
          tva={currentQuote.tva}
          totalTTC={currentQuote.totalTTC}
          remise={currentQuote.remise}
        />
      </Container>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        {(showConfirm && !isConfirmed) || isFromHistory ? (
          <Button
            variant="contained"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={handleOpenConfirmDialog}
            disabled={isConfirmed}
            sx={{
              backgroundColor: isConfirmed ? '#4caf50' : '#1976d2',
              '&:hover': {
                backgroundColor: isConfirmed ? '#4caf50' : '#1565c0',
              },
              '&.Mui-disabled': {
                backgroundColor: '#4caf50',
                color: 'white',
              }
            }}
          >
            {isConfirmed ? 'Devis Confirmé' : 'Confirmer le Devis'}
          </Button>
        ) : null}
      </Box>
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmer le Devis</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Numéro CHANitec"
            type="text"
            fullWidth
            value={numberChanitec}
            onChange={e => setNumberChanitec(e.target.value)}
            disabled={isConfirmed}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="secondary">Annuler</Button>
          <Button onClick={handleSaveConfirm} color="primary" variant="contained" disabled={isConfirmed}>Sauvegarder</Button>
        </DialogActions>
      </Dialog>

      <QuoteActions
        clientName={currentQuote.clientName}
        siteName={currentQuote.siteName}
        date={currentQuote.date}
        isExistingQuote={isExistingQuote}
        onSave={saveQuote}
        onUpdate={updateQuote}
        onViewHistory={() => onNavigate('/history')}
        contentRef={contentRef}
        onPrint={() => onNavigate(`/quote-test?id=${currentQuote.id}`)}
        onDownloadPDF={() => onNavigate(`/quote-test?id=${currentQuote.id}`)}
      />
    </Layout>
  );
};

export default QuotePage;