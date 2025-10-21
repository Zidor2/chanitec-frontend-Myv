import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { PrintOutlined } from '@mui/icons-material';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Layout from '../../components/Layout/Layout';
import { PriceOffer } from '../../models/PriceOffer';
import { priceOfferService } from '../../services/price-offer-service';
import { apiService } from '../../services/api-service';
import { calculateTotalWithRemise, calculateVAT } from '../../utils/calculations';
import './PriceOfferPage.scss';
import logo512 from '../../assets/logo512.png';
import logoChanitec from '../../assets/logo chanitecc.png';
import signatureAyachi from '../../assets/signature-ayachi.png';
import signaturePerrache from '../../assets/signature-perrache.png.png';

interface PriceOfferPageProps {
  currentPath: string;
  onNavigate: (path: string, quoteId?: string) => void;
  quoteId?: string;
  onLogout?: () => void;
}

const PriceOfferPage: React.FC<PriceOfferPageProps> = ({ currentPath, onNavigate, quoteId, onLogout }) => {
  const [priceOffer, setPriceOffer] = useState<PriceOffer | null>(null);
  const [numberToDisplay, setNumberToDisplay] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [signatureOption, setSignatureOption] = useState<'single' | 'double' | 'none'>('double');

  // Function to format description text with "En weekend" in bold red
  const formatDescriptionText = (text: string) => {
    if (text.includes('En weekend')) {
      const parts = text.split('En weekend');
      return (
        <span>
          {parts[0]}
          <span style={{ fontWeight: 'bold', color: 'red' }}>En weekend</span>
          {parts[1]}
        </span>
      );
    }
    return text;
  };

  useEffect(() => {
    const loadPriceOffer = async () => {
      // Try to get quoteId from URL, fallback to prop
      const urlParams = new URLSearchParams(window.location.search);
      const quoteIdFromUrl = urlParams.get('id') || quoteId;
      console.log('Quote ID from URL or prop:', quoteIdFromUrl);

      if (!quoteIdFromUrl) {
        setError('No quote ID provided');
        return;
      }

      try {
        // Find the quote in the list to get createdAt
        let createdAt = '';
        let numberToDisplayLocal = '';
        try {
          const allQuotes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/quotes`).then(res => res.json());
          const found = allQuotes.find((q: any) => q.id === quoteIdFromUrl);
          if (found) {
            createdAt = found.createdAt;
            numberToDisplayLocal = found.number_chanitec && found.number_chanitec.trim() !== '' ? found.number_chanitec : found.id;
          } else {
            setError('Quote not found');
            return;
          }
        } catch (e) {
          setError('Failed to fetch quote list');
          return;
        }
        const quote = await apiService.getQuoteById(quoteIdFromUrl);
        console.log('Fetched quote data:', quote);

        if (!quote) {
          setError('Quote not found');
          return;
        }

        // Create and save the new price offer from the quote
        const savedOffer = priceOfferService.createFromQuote(quote);
        console.log('Created and saved price offer:', savedOffer);

        setPriceOffer(savedOffer);
        setNumberToDisplay(numberToDisplayLocal || (quote.number_chanitec && quote.number_chanitec.trim() !== '' ? quote.number_chanitec : quote.id));
      } catch (error) {
        console.error('Error loading price offer:', error);
        setError('Failed to load price offer. Please try again.');
      }
    };

    loadPriceOffer();
  }, [quoteId]); // Add quoteId to dependencies

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    const canvas = await html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    // Set PDF size to match the rendered content (no A4 limitation)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`Offer de Prix_${numberToDisplay || priceOffer?.quoteId || 'unknown'}.pdf`);
  };

  if (error) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
        <Box className="error-container">
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => onNavigate('/history', undefined)}
            sx={{ mt: 2 }}
          >
            Retour à l'historique
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!priceOffer) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
        <Box className="loading-container">
          <Typography variant="h6">Chargement...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Container maxWidth="lg" className="price-offer-page">


        {/* Wrap the PDF content in a plain div with the ref */}
        <div ref={contentRef}>
          <Paper className="price-offer-content" elevation={2}>
            {/* Header with logos */}
            <Box className="header" sx={{ marginBottom: 4 }}>
              <img src={logo512} alt="Logo" className="logo" />
              <img src={logoChanitec} alt="Chanitec Logo" className="chanitec-logo" />
            </Box>

            {/* Quote Information */}
            <Box className="quote-info-grid">
              <Box className="info-box">
                <Typography variant="subtitle2">NUMERO DEVIS</Typography>
                <Typography variant="subtitle2">CLIENT</Typography>
                <Typography variant="subtitle2">OBJET</Typography>
                <Typography variant="subtitle2">DATE</Typography>
              </Box>
              <Box className="info-box">
                <Typography variant="body1">{numberToDisplay || priceOffer.quoteId}</Typography>
                <Typography variant="body1">{priceOffer.clientName}</Typography>
                <Typography variant="body1">{priceOffer.object}</Typography>
                <Typography variant="body1">{format(new Date(priceOffer.date), 'dd/MM/yyyy')}</Typography>
              </Box>
            </Box>


            {/* Items Table */}
            <Box sx={{ mb: 4 }}>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>ITEM</th>
                    <th>SERVICE / PRODUIT</th>
                    <th>DESIGNATION</th>
                    <th>QTE</th>
                    <th>P.U HT</th>
                    <th>P.T HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Equipement</td>
                    <td>{priceOffer.supplyDescription}</td>
                    <td>1,00</td>
                    <td>{(Number(priceOffer.supplyTotalHT ?? 0)).toFixed(2)}</td>
                    <td>{(Number(priceOffer.supplyTotalHT ?? 0)).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Prestation</td>
                    <td>{formatDescriptionText(priceOffer.laborDescription || '')}</td>
                    <td>1,00</td>
                    <td>{(Number(priceOffer.laborTotalHT ?? 0)).toFixed(2)}</td>
                    <td>{(Number(priceOffer.laborTotalHT ?? 0)).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </Box>

            {/* Totals */}
            <Box sx={{ mb: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '0.4rem' }}>
                      <Typography variant="subtitle1">TOTAL USD HT</Typography>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'right' }}>
                      <Typography variant="body1">{(Number(priceOffer.totalHT ?? 0)).toFixed(2)}</Typography>
                    </td>
                  </tr>
                  {priceOffer.remise && priceOffer.remise > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '0.4rem' }}>
                        <Typography variant="subtitle1">Remise ({priceOffer.remise}%)</Typography>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'right' }}>
                        <Typography variant="body1" sx={{ color: '#4caf50' }}>
                          -{(Number(priceOffer.totalHT ?? 0) * (priceOffer.remise / 100)).toFixed(2)}
                        </Typography>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '0.4rem' }}>
                      <Typography variant="subtitle1">TOTAL HT APRÈS REMISE</Typography>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'right' }}>
                      <Typography variant="body1">
                        {calculateTotalWithRemise(Number(priceOffer.totalHT ?? 0), priceOffer.remise || 0).toFixed(2)}
                      </Typography>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '0.4rem' }}>
                      <Typography variant="subtitle1">TVA: 16%</Typography>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'right' }}>
                      <Typography variant="body1">
                        {calculateVAT(calculateTotalWithRemise(Number(priceOffer.totalHT ?? 0), priceOffer.remise || 0)).toFixed(2)}
                      </Typography>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '0.4rem' }}>
                      <Typography variant="subtitle1">TOTAL USD TTC</Typography>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight="bold">
                        {(Number(priceOffer.totalTTC ?? 0)).toFixed(2)}
                      </Typography>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>

            {/* Conditions */}
            <Box className="conditions" sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Conditions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 45%' }}>
                  <Typography style={{fontWeight: 'bold'}} variant="subtitle2">Validité de l'offre:</Typography>
                  <Typography style={{fontWeight: 'bold'}} variant="subtitle2">Garantie:</Typography>
                  <Typography style={{fontWeight: 'bold'}} variant="subtitle2">Poids / Volume:</Typography>
                  <Typography style={{fontWeight: 'bold'}} variant="subtitle2">Délai de Livraison:</Typography>
                  <Typography style={{fontWeight: 'bold'}} variant="subtitle2">Pays d'origine / provenance:</Typography>
                  <Typography style={{fontWeight: 'bold'}} variant="subtitle2">Modalité de paiement:</Typography>
                </Box>
                <Box sx={{ flex: '1 1 45%' }}>
                  <Typography style={{ marginBottom: '.5rem' }} variant="body2">14 jours à dater de l'offre</Typography>
                  <Typography style={{ marginBottom: '.5rem' }} variant="body2">N/A</Typography>
                  <Typography style={{ marginBottom: '.5rem' }} variant="body2">N/A</Typography>
                  <Typography style={{ marginBottom: '.5rem' }} variant="body2">+/- 1 jour</Typography>
                  <Typography style={{ marginBottom: '.5rem' }} variant="body2">N/A</Typography>
                  <Typography style={{ marginBottom: '.5rem' }} variant="body2">100% à la commande</Typography>
                </Box>
              </Box>
            </Box>

            <Typography style={{fontWeight: 'bold', marginBottom: '2rem',fontSize: '.8rem'}} variant="subtitle2" gutterBottom>
              NB: Après prise de RDV, le client doit faciliter l'acces au bureau/pièce concerné. Si l'intervnetion ne peut se faire faute de disponibilité, un déplacment pourra être facturé
            </Typography>

            {/* Bank Details */}
            <Box className="bank-details">
              <Typography variant="subtitle2" gutterBottom>
                PAIEMENT PAR VIREMENT BANCAIRE SUR L'UN DES COMPTES SUIVANT OU EN ESPECES A NOTRE CAISSE
              </Typography>
              <Typography variant="body2">
                BOA USD 00 029-01001-01033700012-13 EQUITYBCDC USD 00 011-00101-00000117533-24
              </Typography>
              <Typography variant="body2">
                FBN USD 00 084-84001-20300170009-55  RAWBANK USD 05 100-05101-01000022102-18
              </Typography>
              <Typography variant="body2">
                SOFIBANQUE USD 00 023-20190-01661660200-15 TMB USD 00 017-11000-50045270101-56
              </Typography>
              <Typography variant="body2">
                ECOBANK USD 00 026-00001-03600841201-27
              </Typography>
            </Box>
            {/* Signatures and Footer (Updated) */}
            <Box className="signatures-row updated-signatures">
              <Box className="signature signature-left">
                <Typography variant="subtitle2" fontWeight="bold">Bilel AYACHI</Typography>
                <Typography variant="body2" fontWeight="bold">Responsable Dpt Climatisation et Froid</Typography>
                <Box className="signature-placeholder" sx={{ minHeight: '60px', margin: '16px 0', display: 'block', textAlign: 'center' }}>
                  {(signatureOption === 'double' || signatureOption === 'single') && (
                    <img src={signatureAyachi} alt="Signature Bilel Ayachi" style={{ maxHeight: '60px', maxWidth: '100%', display: 'block', margin: '0 auto' }} />
                  )}
                </Box>
              </Box>
              <Box className="signature signature-right" sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" fontWeight="bold">Amandine PERRACHE - MINESI</Typography>
                <Typography variant="body2" fontWeight="bold">Directrice Commerciale</Typography>
                <Box className="signature-placeholder" sx={{ minHeight: '60px', margin: '16px 0', display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                  {signatureOption === 'double' && (
                    <>
                      <img src={signatureAyachi} alt="Signature Bilel Ayachi" style={{ maxHeight: '60px', maxWidth: '100%', display: 'inline-block', margin: '0 auto' }} />
                      <span style={{ marginLeft: '0.1rem', fontWeight: 'bold', fontSize: '1.1em' }}>P/I</span>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
            {/* No signature if 'none' is selected */}
            <Box className="price-offer-note" sx={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              NB: Votre commande implique l’acceptation de nos conditions générales de vente consultables sur notre site web www.chanic.com
            </Box>
            <Box className="price-offer-footer" sx={{ borderTop: '1px solid #000', paddingTop: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
              <div>Groupe Chanimetal</div>
              <div>Avenue de la Montagne n°2297, C/Ngaliema, Kinshasa, R.D. CONGO - +243(0)81 715 27 20 - groupechanimetal@chanic.com</div>
              <div>RCCM 14-B-3324 Kin – Id Nat 01-F4200-A22984H – NIF A070005Q2 – TVA 0390</div>
            </Box>
          </Paper>
        </div>
        <Box className="actions-bar" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<PrintOutlined />}
            onClick={handlePrint}
            sx={{ mr: 2 }}
          >
            Imprimer
          </Button>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="signature-select-label">Signatures</InputLabel>
            <Select
              labelId="signature-select-label"
              id="signature-select"
              value={signatureOption}
              label="Signatures"
              onChange={e => setSignatureOption(e.target.value as 'single' | 'double' | 'none')}
            >
              <MenuItem value="single">Signature</MenuItem>
              <MenuItem value="double">Double signature</MenuItem>
              <MenuItem value="none">No signature</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Container>
    </Layout>
  );
};

export default PriceOfferPage;