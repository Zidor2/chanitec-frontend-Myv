import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import Layout from '../../components/Layout/Layout';
import { useQuote } from '../../contexts/QuoteContext';
import './QuoteTest.scss';
import logo from '../../logo.png';
import { useLocation, useNavigate } from 'react-router-dom';
import PrintBackgroundLogos from '../../components/PrintBackgroundLogos/PrintBackgroundLogos';
import { formatNumberWithSpaces, calculateTotalWithRemise, calculateTotalWithRemiseAndHBC, calculateVAT } from '../../utils/calculations';
import { apiService } from '../../services/api-service';

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
              const found = await apiService.getQuoteById(quoteId);
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
  }, [quoteId, isLoading, currentQuote, loadQuote, createNewQuote, navigate]);


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

    const cleanup = () => {
      setIsPdfMode(false);
      window.removeEventListener('afterprint', cleanup);
      if (timeoutId) clearTimeout(timeoutId);
    };

    window.addEventListener('afterprint', cleanup);

    const timeoutId = setTimeout(cleanup, 15000);

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 50);
    });
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

  const remiseAmount = currentQuote.remise && currentQuote.remise > 0
    ? currentQuote.totalHT * (currentQuote.remise / 100)
    : 0;
  const totalAfterRemise = calculateTotalWithRemise(currentQuote.totalHT, currentQuote.remise || 0);
  const totalAfterHBC = currentQuote.hbc && currentQuote.hbc > 0
    ? calculateTotalWithRemiseAndHBC(currentQuote.totalHT, currentQuote.remise || 0, currentQuote.hbc)
    : totalAfterRemise;

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onHomeClick={handleHomeClick}>
      <div ref={contentRef} className={`quote-test-content ${isPdfMode ? 'is-pdf-mode' : ''}`}>
        <PrintBackgroundLogos />

        <header className="reference-header">
          <img src={logo} alt="Groupe Chanic" className="reference-logo" />
          <h1 className="reference-title">CALCUL DE PRIX OFFRE CLIMATISATION</h1>
        </header>

        <section className="client-info-box">
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
                <input type="text" value={currentQuote.date || ''} disabled />
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
        </section>

        <div className="summary-wrap">
          <table className="summary-table">
            <tbody>
              <tr>
                <th>TOTAL OFFRE USD HT:</th>
                <td>{formatNumberWithSpaces(currentQuote.totalHT)}</td>
              </tr>
              {currentQuote.remise !== undefined && currentQuote.remise !== null && currentQuote.remise > 0 && (
                <tr>
                  <th>REMISE:</th>
                  <td>-{formatNumberWithSpaces(remiseAmount)}</td>
                </tr>
              )}
              {currentQuote.remise !== undefined && currentQuote.remise !== null && currentQuote.remise > 0 && (
                <tr>
                  <th>TOTAL HT APRÈS REMISE:</th>
                  <td>{formatNumberWithSpaces(totalAfterRemise)}</td>
                </tr>
              )}
              {currentQuote.hbc !== undefined && currentQuote.hbc !== null && currentQuote.hbc > 0 && (
                <tr>
                  <th>HBC ({currentQuote.hbc.toFixed(2)}%):</th>
                  <td>{formatNumberWithSpaces(totalAfterHBC - totalAfterRemise)}</td>
                </tr>
              )}
              <tr>
                <th>TVA:</th>
                <td>{formatNumberWithSpaces(calculateVAT(totalAfterHBC))}</td>
              </tr>
              <tr>
                <th>TOTAL OFFRE USD TTC:</th>
                <td>{formatNumberWithSpaces(currentQuote.totalTTC)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="quote-section supplies-section">
          <h2 className="section-title">FOURNITURES</h2>
          <div className="section-meta">
            <span className="description">{currentQuote.supplyDescription || ''}</span>
            <div className="tx-row">
              <span><strong>Tx de chg:</strong> {currentQuote.supplyExchangeRate || 1.15}</span>
              <span><strong>Tx de marge:</strong> {currentQuote.supplyMarginRate || 0.75}</span>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-desc">Description</th>
                <th className="col-num">Qté</th>
                <th className="col-num">PR €</th>
                <th className="col-num">PR $</th>
                <th className="col-num">PV/u $</th>
                <th className="col-num">PV $ Total HT</th>
              </tr>
            </thead>
            <tbody>
              {currentQuote.supplyItems.map((item, idx) => {
                const exchange = currentQuote.supplyExchangeRate || 1.15;
                const margin = currentQuote.supplyMarginRate || 0.75;
                const prDollar = item.priceEuro * exchange;
                const pvUnit = prDollar * (1 / margin);
                const pvTotal = item.quantity * pvUnit;
                return (
                  <tr key={idx}>
                    <td className="col-desc">{item.description}</td>
                    <td className="col-num">{item.quantity}</td>
                    <td className="col-num">{formatNumberWithSpaces(item.priceEuro)}</td>
                    <td className="col-num">{formatNumberWithSpaces(prDollar)}</td>
                    <td className="col-num">{formatNumberWithSpaces(pvUnit)}</td>
                    <td className="col-num">{formatNumberWithSpaces(pvTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan={5} className="totals-label">TOTAL FOURNITURE $ HT:</td>
                <td className="col-num">
                  {formatNumberWithSpaces(
                    currentQuote.supplyItems.reduce((sum, item) => {
                      const exchange = currentQuote.supplyExchangeRate || 1.15;
                      const margin = currentQuote.supplyMarginRate || 0.75;
                      return sum + item.quantity * item.priceEuro * exchange * (1 / margin);
                    }, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="quote-section labor-section">
          <h2 className="section-title">MAIN D'OEUVRE</h2>
          <div className="section-meta">
            <span className="description">{currentQuote.laborDescription || ''}</span>
            <div className="tx-row">
              <span><strong>Tx de chg:</strong> {currentQuote.laborExchangeRate || 1.2}</span>
              <span><strong>Tx de marge:</strong> {currentQuote.laborMarginRate || 0.8}</span>
            </div>
          </div>
          <table className="data-table labor-table">
            <thead>
              <tr>
                <th className="col-desc">Description</th>
                <th className="col-num">Nb technicien</th>
                <th className="col-num">Nb heures</th>
                <th className="col-num">Majo Weekend</th>
                <th className="col-num">PR €</th>
                <th className="col-num">PR $</th>
                <th className="col-num">PV/u $</th>
                <th className="col-num">PV $ Total HT</th>
              </tr>
            </thead>
            <tbody>
              {currentQuote.laborItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="col-desc">{item.description}</td>
                  <td className="col-num">{item.nbTechnicians}</td>
                  <td className="col-num">{item.nbHours}</td>
                  <td className="col-num">{item.weekendMultiplier}</td>
                  <td className="col-num">{formatNumberWithSpaces(item.priceEuro)}</td>
                  <td className="col-num">{formatNumberWithSpaces(item.priceDollar || 0)}</td>
                  <td className="col-num">{formatNumberWithSpaces(item.unitPriceDollar || 0)}</td>
                  <td className="col-num">{formatNumberWithSpaces(item.totalPriceDollar || 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan={7} className="totals-label">TOTAL MO $ HT:</td>
                <td className="col-num">{formatNumberWithSpaces(currentQuote.totalLaborHT)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {!isPdfMode && (
          <div className="quote-actions">
            <button type="button" className="btn-save" onClick={handlePrint}>
              Imprimer
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuoteTest;