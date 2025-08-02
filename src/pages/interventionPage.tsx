import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './interventionPage.scss';
import { Button, Box, AppBar, Toolbar } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Correct logo imports for React (public folder)
const logoChanic = process.env.PUBLIC_URL + '/chanic.png';
const logoChanitec = process.env.PUBLIC_URL + '/chanitec.png';
const logoTrane = process.env.PUBLIC_URL + '/trane.png';

export default function InterventionPage() {
  const navigate = useNavigate();
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
    <Box className="intervention-page">
      <AppBar position="static" color="primary" className="intervention-navbar">
        <Toolbar>
          <Box className="nav-buttons">
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/home')}
              className="nav-button"
            >
              Retour
            </Button>
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
        </Toolbar>
      </AppBar>

      <div className="intervention-a4-container" ref={interventionRef}>
        {/* Header Logos */}
        <div className="intervention-header-logos cell-white">
          <img src={logoChanitec} alt="CHANITEC Logo" />
          <div className="center-logo">
            <img src={logoChanic} alt="CHANIC Logo" />
          </div>
          <img src={logoTrane} alt="TRANE Logo" />
        </div>

        {/* Title Row */}
        <div className="title-row-table">
          <div className="title-row-cell title-row-main"><b>Fiche d'intervention N°</b></div>
          <div className="title-row-cell title-row-date"><b>DATE :</b></div>
          <div className="title-row-cell title-row-center"><b>DÉP</b></div>
          <div className="title-row-cell title-row-center"><b>ENT</b></div>
          <div className="title-row-cell"></div>
        </div>

        {/* Info Row */}
        <div className="info-row-table">
          <div className="info-row-address">Avenue Colonel Mondjiba BP 8512<br />KINSHASA NGALIEMA</div>
          <div className="info-row-header">CENTRE</div>
          <div className="info-row-header">LOCAL</div>
          <div className="info-row-header">N° DE SÉRIE</div>
          <div className="info-row-header">MARQUE</div>
          <div className="info-row-header">P(KW) / BTU</div>
          <div className="info-row-header">CODE</div>
          <div className="info-row-cell"></div>
          <div className="info-row-cell"></div>
          <div className="info-row-cell"></div>
          <div className="info-row-cell"></div>
          <div className="info-row-cell"></div>
          <div className="info-row-cell"></div>
        </div>

        {/* Main Table */}
        <div className="intervention-main-table">
          {/* 1. UNITE EXTERIEURE + 4. COFFRET ELECTRIQUE COMMANDE & PUISSANCE (Combined Table) */}
          <div className="unite-coffret-combined-table">
            <div className="unite-coffret-header unite-coffret-header-main">I. UNITE EXTERIEURE</div>
            <div className="unite-coffret-label">Vérification  de l'absence d'échauffement</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Vérification  de l'absence de vibration</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Dépoussiérage  câblage  électrique</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Serrage des connexions  électriques</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Nettoyage du condenseur  (Eau & Produit détergent)</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Vérification  de l'unité extérieure</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Vérification  fonctionnement du variateur de vitesse</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-header unite-coffret-header-section">4. COFFRET ELECTRIQUE  COMMANDE & PUISSANCE</div>
            <div className="unite-coffret-label">Nettoyage & Dépoussiérage  Coffret électrique</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Serrage des connexions  électriques</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Vérification  Etat des Fusibles Coffret de puissance</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Vérification  Etat des Voyants & Fonctionnement Sirène</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
            <div className="unite-coffret-label">Vérification  fonctionnement minuterie</div><div className="unite-coffret-cell"><input type="checkbox" /></div>
          </div>

          {/* 2. UNITE INTERIEURE + 3. LIAISONS ELECTRIQUES ET FRIGORIFIQUES (Combined Table) */}
          <div className="interieure-liaisons-combined-table">
            <div className="interieure-liaisons-header interieure-liaisons-header-main">2. UNITE INTERIEURE</div>
            <div className="interieure-liaisons-label">Nettoyage de l'évaporateur</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérification de la fixation de l'unité intérieure</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Nettoyage  à l'eau ou  à l'air comprimé  du filtre</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Nettoyage du bac condensat</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérifier la fixation  du circuit de condensat</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérifier la fixation  du Plenum & grille de soufflage</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Serrage des connexions  électriques (comp, MV)</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérification  de l'absence d'échauffement anormal</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérification  de l'absence de vibration</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérification  des paramètres  au niveau</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérification  de l'état des portes</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Changement du filtre à air</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-header interieure-liaisons-header-section">3. LIAISONS ELECTRIQUES ET FRIGORIFIQUES</div>
            <div className="interieure-liaisons-label">Vérification  Fixation des circuits Frigorifiques</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérification  Calorifuge des circuits</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
            <div className="interieure-liaisons-label">Vérification  Fixation des circuits Electriques</div><div className="interieure-liaisons-cell"><input type="checkbox" /></div>
          </div>

          {/* 5. MESURE & RELEVE + 6. ESSAIS ELECTRIQUE & FRIGORIFIQUE (Combined Table) */}
          <div className="mesure-essais-combined-table">
            <div className="mesure-essais-header-clim">5. MESURE & RELEVE</div>
            <div className="mesure-essais-header-clim">CLIM1</div>
            <div className="mesure-essais-header-clim">CLIM2</div>
            <div className="mesure-essais-header-clim">CLIM3</div>
            <div className="mesure-essais-header-clim">CLIM4</div>
            <div className="mesure-essais-label">Tension Générale  Climatiseur</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Intensité Générale Climatiseur</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Intensité Compresseur</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Intensité Moteurs Ventilateurs Cond</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Intensité Moteurs Ventilateurs Evap</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Haute pression (HP)</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Basse pression (BP)</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Température de soufflage</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Température  du local</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Débit d'air de soufflage</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-header-section">6. ESSAIS ELECTRIQUE & FRIGORIFIQUE</div>
            <div className="mesure-essais-label">Essai de la sécurité BP</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Essai de la sécurité HP</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Essai Marche Forcée en cas HT°</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
            <div className="mesure-essais-label">Essai du basculement  en cas de défaut</div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div><div className="mesure-essais-cell"></div>
          </div>
        </div>

        {/* 7. COMPTE RENDU RESPONSABLE TECHNIQUE (CLIENT) + 8. OBSERVATIONS (Combined Table) */}
        <div className="compte-observations-table">
          <div className="compte-observations-header">7. COMPTE RENDU RESPONSABLE TECHNIQUE (CLIENT)</div>
          <div className="compte-observations-header">8. OBSERVATIONS</div>
          <div className="compte-observations-cell">
            <textarea className="compte-observations-textarea" />
          </div>
          <div className="compte-observations-cell">
            <textarea className="compte-observations-textarea" />
          </div>
        </div>

        {/* Signatures (Combined Table) */}
        <div className="signatures-table">
          <div className="signatures-header">Nom, Prénom & Signature Responsable Technique (Client)</div>
          <div className="signatures-header">Nom, Prénom & Signature Technicien (Chanitec)</div>
          <div className="signatures-cell">
            <input className="signatures-input" type="text" />
          </div>
          <div className="signatures-cell">
            <input className="signatures-input" type="text" />
          </div>
        </div>
      </div>
    </Box>
  );
}