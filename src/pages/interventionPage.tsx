import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './interventionPage.scss';
import { Button, Box } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import Layout from '../components/Layout/Layout';

// Correct logo imports for React (public folder)
const logoChanic = process.env.PUBLIC_URL + '/chanic.png';
const logoChanitec = process.env.PUBLIC_URL + '/chanitec.png';
const logoTrane = process.env.PUBLIC_URL + '/trane.png';

interface InterventionPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

export default function InterventionPage({ 
  currentPath = '/intervention', 
  onNavigate, 
  onLogout 
}: InterventionPageProps) {
  const interventionRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!interventionRef.current) return;

    try {
      const canvas = await html2canvas(interventionRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: interventionRef.current.offsetWidth,
        height: interventionRef.current.offsetHeight,
        windowWidth: interventionRef.current.offsetWidth,
        windowHeight: interventionRef.current.offsetHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions in mm
      const pageWidth = 297;
      const pageHeight = 210;

      // Calculate scaling to fit the page
      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;

      let finalWidth, finalHeight;

      if (imgRatio > pageRatio) {
        // Image is wider than page ratio
        finalWidth = pageWidth;
        finalHeight = pageWidth / imgRatio;
      } else {
        // Image is taller than page ratio
        finalHeight = pageHeight;
        finalWidth = pageHeight * imgRatio;
      }

      // Center the content
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = (pageHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save('fiche-intervention.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className="intervention-page">
        <Box className="intervention-header">
          <Box className="nav-buttons">
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              className="nav-button"
            >
              Imprimer
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              className="nav-button"
            >
              Télécharger PDF
            </Button>
          </Box>
        </Box>

        <div ref={interventionRef} className="intervention-content">
          {/* Rest of the intervention content remains the same */}
          <div className="intervention-form">
            <div className="header-section">
              <div className="logo-section">
                <img src={logoChanic} alt="Chanic Logo" className="logo-chanic" />
                <img src={logoChanitec} alt="Chanitec Logo" className="logo-chanitec" />
                <img src={logoTrane} alt="Trane Logo" className="logo-trane" />
              </div>
              <div className="title-section">
                <h1>FICHE D'INTERVENTION</h1>
              </div>
            </div>

            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Date:</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Heure de début:</label>
                  <input type="time" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Heure de fin:</label>
                  <input type="time" className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Client:</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Site:</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Contact:</label>
                  <input type="text" className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Équipe:</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Type d'intervention:</label>
                  <select className="form-input">
                    <option value="">Sélectionner</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reparation">Réparation</option>
                    <option value="installation">Installation</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Équipement:</label>
                  <input type="text" className="form-input" />
                </div>
              </div>

              <div className="form-section">
                <h3>Description des travaux</h3>
                <textarea className="form-textarea" rows={4}></textarea>
              </div>

              <div className="form-section">
                <h3>Matériaux utilisés</h3>
                <textarea className="form-textarea" rows={3}></textarea>
              </div>

              <div className="form-section">
                <h3>Observations</h3>
                <textarea className="form-textarea" rows={3}></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Signature technicien:</label>
                  <div className="signature-box"></div>
                </div>
                <div className="form-group">
                  <label>Signature client:</label>
                  <div className="signature-box"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </Layout>
  );
}