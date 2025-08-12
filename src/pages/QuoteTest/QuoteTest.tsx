import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import Layout from '../../components/Layout/Layout';
import { useQuote } from '../../contexts/QuoteContext';
import './QuoteTest.scss';
import logo from '../../logo.png';
import { useLocation, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
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

// Add a helper function for number formatting to 2 decimal places
function formatNumber(value: number | string | undefined): string {
  if (value === undefined || value === null) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

interface QuoteTestProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const QuoteTest: React.FC<QuoteTestProps> = ({ currentPath, onNavigate }) => {
  const {
    state,
    createNewQuote,
    setQuoteField,
    clearQuote,
    loadQuote
  } = useQuote();

  const { currentQuote, isLoading } = state;
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const quoteId = new URLSearchParams(location.search).get('id');

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
              const allQuotes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/quotes`).then(res => res.json());
              const found = allQuotes.find((q: any) => q.id === quoteId);
              if (found) {
                createdAt = found.createdAt;
              }
            } catch (e) {}
          }
          await loadQuote(quoteId, createdAt);
          console.log('Quote loaded successfully');
        } catch (error) {
          console.error('Error loading quote:', error);
          navigate('/');
        }
      } else if (!currentQuote && !isLoading && !quoteId) {
        console.log('No quote ID provided, creating new quote');
        createNewQuote();
      }
    };

    loadQuoteData();
  }, [quoteId, createNewQuote, currentQuote, isLoading, loadQuote, navigate]);

  // Update isReadOnly when currentQuote changes
  useEffect(() => {
    if (currentQuote) {
      setIsReadOnly(currentQuote.confirmed || false);
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
      <div ref={contentRef} className={isPdfMode ? 'is-pdf-mode' : ''}>
        {/* Background Logo */}
        <img src={logo512} alt="Background Logo" className="background-logo" />
        {/* Second Background Logo */}
        <img src={CHANitec} alt="CHANitec Logo" className="background-logo-second" />

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

        {/* Totals Section - Display backend calculated values */}
        <div className="clearfix">
          <table className="summary-table" style={{ float: 'right' }}>
            <tbody>
              <tr><th>TOTAL OFFRE USD HT:</th><td>{formatNumber(currentQuote.totalHT)}</td></tr>
              <tr><th>TVA:</th><td>{formatNumber(currentQuote.tva)}</td></tr>
              <tr><th>TOTAL OFFRE USD TTC:</th><td>{formatNumber(currentQuote.totalTTC)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Fournitures Section - Display backend calculated values */}
        <div className="section-title">FOURNITURES</div>
        <div className="input-row">
          <span> {currentQuote.supplyDescription || ''} </span>
          <div className='tx-row'>
            <label>Tx de chg:</label>
            <span> {formatNumber(currentQuote.supplyExchangeRate || 1.15)}</span>
            <label>Tx de marge:</label>
            <span>{formatNumber(Number(currentQuote.supplyMarginRate) || 0.75)}</span>
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
                <td>{item.quantity}</td>
                <td>{formatNumber(item.priceEuro)}</td>
                <td>{formatNumber(item.priceDollar)}</td>
                <td>{formatNumber(item.unitPriceDollar)}</td>
                <td>{formatNumber(item.totalPriceDollar)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL FOURNITURE $ HT:</td>
              <td colSpan={2}>{formatNumber(currentQuote.totalSuppliesHT)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Main d'oeuvre Section - Display backend calculated values */}
        <div className="section-title">MAIN D'OEUVRE</div>
        <div className="input-row">
          <span>{currentQuote.laborDescription || ''}</span>
          <div className='tx-row'>
            <label>Tx de chg:</label>
            <span>{formatNumber(currentQuote.laborExchangeRate || 1.2)}</span>
            <label>Tx de marge:</label>
            <span>{formatNumber(Number(currentQuote.laborMarginRate) || 0.8)}</span>
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
                <td>{formatNumber(item.weekendMultiplier)}</td>
                <td>{formatNumber(item.priceEuro)}</td>
                <td>{formatNumber(item.priceDollar)}</td>
                <td>{formatNumber(item.unitPriceDollar)}</td>
                <td>{formatNumber(item.totalPriceDollar)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={6} style={{ textAlign: 'right' }}>TOTAL MO $ HT:</td>
              <td colSpan={2}>{formatNumber(currentQuote.totalLaborHT)}</td>
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