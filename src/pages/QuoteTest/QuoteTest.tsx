import React, { useRef, useEffect, useState } from 'react';
import { Box, Container, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Layout from '../../components/Layout/Layout';
import { useQuote } from '../../contexts/QuoteContext';
import './QuoteTest.scss';
import logo from '../../logo.png';
import { useLocation, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { SupplyItem, LaborItem } from '../../models/Quote';
import { generateId } from '../../utils/id-generator';
import logo512 from '../../assets/logo512.png';
import CHANitec from '../../assets/CHANitec.png';

// Add a helper function for date formatting at the top level
function formatDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface QuoteTestProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const QuoteTest: React.FC<QuoteTestProps> = ({ currentPath, onNavigate }) => {
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
    recalculateTotals,
    clearQuote,
    loadQuote,
    updateLaborItem
  } = useQuote();

  const { currentQuote, isLoading, isExistingQuote, originalQuoteId } = state;
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const quoteId = new URLSearchParams(location.search).get('id');

  const [isFromHistory, setIsFromHistory] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isPdfMode, setIsPdfMode] = useState(false);

  // Load quote if ID is provided in URL
  useEffect(() => {
    const loadQuoteData = async () => {
      if (!isLoading && quoteId && (!currentQuote || currentQuote.id !== quoteId)) {
        try {
          console.log('Attempting to load quote with ID:', quoteId);
          // Fetch createdAt for the quoteId
          let createdAt = '';
          if (currentQuote && currentQuote.id === quoteId) {
            createdAt = currentQuote.createdAt;
          } else {
            try {
              const allQuotes = await fetch(`${process.env.REACT_APP_API_URL}/quotes`).then(res => res.json());
              const found = allQuotes.find((q: any) => q.id === quoteId);
              if (found) {
                createdAt = found.createdAt;
              }
            } catch (e) {}
          }
          await loadQuote(quoteId, createdAt);
          console.log('Quote loaded successfully');
          setIsReady(true);
        } catch (error) {
          console.error('Error loading quote:', error);
          navigate('/');
        }
      } else if (!currentQuote && !isLoading && !quoteId) {
        console.log('No quote ID provided, creating new quote');
        createNewQuote();
        setIsReady(true);
      }
    };

    loadQuoteData();
  }, [quoteId]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const fromHistory = queryParams.get('fromHistory') === 'true';
    const confirmed = queryParams.get('confirmed') === 'true';
    setIsFromHistory(fromHistory);
    setIsConfirmed(confirmed);
  }, []);

  // Update isReadOnly when currentQuote changes
  useEffect(() => {
    if (currentQuote) {
      setIsReadOnly(currentQuote.confirmed || false);
      setIsConfirmed(currentQuote.confirmed || false);
    }
  }, [currentQuote]);

  // Handle navigation from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'quoteToLoad' && e.newValue) {
        const quoteToLoad = JSON.parse(e.newValue);
        if (quoteToLoad.id) {
          navigate(`/quote-test?id=${quoteToLoad.id}`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const handleHomeClick = () => {
    clearQuote();
    createNewQuote();
    onNavigate('/');
  };

  const handleConfirmQuote = async () => {
    if (!currentQuote) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/quotes/${currentQuote.id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm quote');
      }

      setIsConfirmed(true);
      setIsReadOnly(true);
      alert('Devis confirmé avec succès. Prêt pour un nouveau devis.');
      clearQuote();
      createNewQuote();
    } catch (error) {
      console.error('Error confirming quote:', error);
      alert('Erreur lors de la confirmation du devis');
    }
  };

  const handleGeneratePDF = async () => {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      setIsPdfMode(true);
      // Fallback: in case PDF generation hangs, reset after 5 seconds
      timeoutId = setTimeout(() => {
        setIsPdfMode(false);
      }, 5000);
      console.log('Current state:', {
        contentRef: contentRef.current,
        currentQuote: currentQuote,
        isLoading: isLoading
      });

      if (!contentRef.current) {
        console.error('Content reference is missing');
        alert('Impossible de générer le PDF: la référence au contenu est manquante');
        setIsPdfMode(false);
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }

      if (!currentQuote) {
        console.error('Current quote is missing');
        alert('Impossible de générer le PDF: le devis actuel est manquant');
        setIsPdfMode(false);
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }

      if (isLoading) {
        console.error('Quote is still loading');
        alert('Veuillez patienter pendant le chargement du devis');
        setIsPdfMode(false);
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }

      console.log('Starting PDF generation...');
      const element = contentRef.current;

      const opt = {
        margin: 5, // Set margin to 0 for closer print match
        filename: `devis-${currentQuote.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1.25, // Adjust scale for closer print match
          useCORS: true,
          logging: true
        },
        enableLinks: true,
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate PDF with save dialog
      await html2pdf()
        .from(element)
        .set(opt)
        .save();

      console.log('PDF generation completed');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsPdfMode(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const handlePrint = () => {
    setIsPdfMode(true);
    window.print();

    // Reset PDF mode after print dialog closes
    const handleAfterPrint = () => {
      setIsPdfMode(false);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (timeoutId) clearTimeout(timeoutId);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    // Fallback: in case afterprint is not fired, reset after 5 seconds
    const timeoutId = setTimeout(() => {
      setIsPdfMode(false);
      window.removeEventListener('afterprint', handleAfterPrint);
    }, 5000);
  };

  // Show loading or error state
  if (isLoading) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onHomeClick={handleHomeClick}>
        <Box className="loading-container">
          <Typography variant="h6">Chargement en cours...</Typography>
        </Box>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onHomeClick={handleHomeClick}>
        <Box className="error-container">
          <Typography variant="h6" color="error">
            Erreur: {state.error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            style={{ marginTop: '20px' }}
          >
            Retour à l'accueil
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!currentQuote) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onHomeClick={handleHomeClick}>
        <Box className="error-container">
          <Typography variant="h6">
            Aucun devis trouvé
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            style={{ marginTop: '20px' }}
          >
            Retour à l'accueil
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onHomeClick={handleHomeClick}>
      <div ref={contentRef} className={`quote-test-content ${isPdfMode ? 'is-pdf-mode' : ''}`}>
        {/* Background Logo */}
        <img src={logo512} alt="Background Logo" className="background-logo" />
        <img src={CHANitec} alt="Chanitec Logo" className="background-logo-second" />

        {/* Header Section */}
        <div className="reference-header">
          <img src={logo} alt="Logo" className="reference-logo" />
          <div className="reference-title">CALCUL DE PRIX OFFRE CLIMATISATION</div>
        </div>

        {/* Client Info Section */}
        <div className="client-info-box">
          <div className="client-info-grid">
            <div className="client-info-label">CLIENT:</div>
            <div className="client-info-value">
              <input
                type="text"
                value={currentQuote.clientName}
                onChange={e => setQuoteField('clientName', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="client-info-label">SITE:</div>
            <div className="client-info-value">
              <input
                type="text"
                value={currentQuote.siteName}
                onChange={e => setQuoteField('siteName', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="client-info-label">OBJET:</div>
            <div className="client-info-value">
              <input
                type="text"
                value={currentQuote.object}
                onChange={e => setQuoteField('object', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="client-info-label">DATE:</div>
            <div className="client-info-value">
              {isPdfMode ? (
                <input
                  type="text"
                  value={formatDate(currentQuote.date)}
                  disabled
                />
              ) : (
                <input
                  type="date"
                  value={currentQuote.date}
                  onChange={e => setQuoteField('date', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </div>
          </div>
        </div>

        {/* Totals Section */}
        <div className="clearfix">
          <table className="summary-table" style={{ float: 'right' }}>
            <tbody>
              <tr><th>TOTAL OFFRE USD HT:</th><td>{currentQuote.totalHT}</td></tr>
              <tr><th>TVA:</th><td>{(currentQuote.totalHT * (16 / 100)).toFixed(2)}</td></tr>
              <tr><th>TOTAL OFFRE USD TTC:</th><td>{currentQuote.totalTTC}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Fournitures Section */}
        <div className="section-title">FOURNITURES</div>
        <div className="input-row">
        <span> {currentQuote.supplyDescription || ''} </span>
          <div className='tx-row'>
          <label>Tx de chg:</label>
          <span> {currentQuote.supplyExchangeRate || 1.15}</span>
          <label>Tx de marge:</label>
          <span>{currentQuote.supplyMarginRate || 0.75}</span>
        </div>

        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qté</th>
              <th>PR €</th>
              <th>PR $</th>
              <th>PV/u $</th>
              <th>PV $ Total HT</th>
            </tr>
          </thead>
          <tbody>
            {currentQuote.supplyItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td>{item.quantity} </td>
                <td>{item.priceEuro}</td>
                <td>{(item.priceEuro * (currentQuote.supplyExchangeRate || 1.15)).toFixed(2)}</td>
                <td>{((item.priceEuro * (currentQuote.supplyExchangeRate || 1.15)) * (1 / (currentQuote.supplyMarginRate || 0.75))).toFixed(2)}</td>
                <td>{((item.quantity * item.priceEuro * (currentQuote.supplyExchangeRate || 1.15)) * (1 / (currentQuote.supplyMarginRate || 0.75))).toFixed(2)} </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL FOURNITURE $ HT:</td>
              <td colSpan={2}>{currentQuote.supplyItems.reduce((sum, item) => sum + ((item.quantity * item.priceEuro * (currentQuote.supplyExchangeRate || 1.15)) * (1 / (currentQuote.supplyMarginRate || 0.75))), 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Main d'oeuvre Section */}
        <div className="section-title">MAIN D'OEUVRE</div>
        <div className="input-row">
          <span>{currentQuote.laborDescription || ''}</span>
          <div className='tx-row'>
          <label>Tx de chg:</label>
          <span>{currentQuote.laborExchangeRate || 1.2}</span>
          <label>Tx de marge:</label>
          <span>{currentQuote.laborMarginRate || 0.8}</span>
          </div>
        </div>


        <table className="data-table">
          <thead>
            <tr>
              <th>Nb technicien</th>
              <th>Nb heures</th>
              <th>Majo Weekend</th>
              <th>PR €</th>
              <th>PR $</th>
              <th>PV/u $</th>
              <th>PV $ Total HT</th>
            </tr>
          </thead>
          <tbody>
            {currentQuote.laborItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.nbTechnicians}</td>
                <td>{item.nbHours}</td>
                <td>{item.weekendMultiplier}</td>
                <td>{item.priceEuro}</td>
                <td>{(item.priceEuro * (currentQuote.laborExchangeRate || 1.2)).toFixed(2)}</td>
                <td>{((item.priceEuro * (currentQuote.laborExchangeRate || 1.2)) * (1 / (currentQuote.laborMarginRate || 0.8))).toFixed(2)}</td>
                <td>{((item.nbTechnicians * item.nbHours * item.priceEuro * (currentQuote.laborExchangeRate || 1.2)) * (1 / (currentQuote.laborMarginRate || 0.8))).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={6} style={{ textAlign: 'right' }}>TOTAL MO $ HT:</td>
              <td colSpan={2}>{currentQuote.laborItems.reduce((sum, item) => sum + ((item.nbTechnicians * item.nbHours * item.priceEuro * (currentQuote.laborExchangeRate || 1.2)) * (1 / (currentQuote.laborMarginRate || 0.8))), 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Action Buttons */}
        {!isPdfMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, margin: '30px 0' }}>
            <button className="btn-save" onClick={handlePrint}> {'Imprimer'}</button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuoteTest;