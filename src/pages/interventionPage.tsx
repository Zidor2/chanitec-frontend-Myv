import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './interventionPage.scss';
import { Button, Box } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import Layout from '../components/Layout/Layout';

// Correct logo imports for React (public folder)
const logoChanic = process.env.PUBLIC_URL + '/CHANitec.png';
const logoTrane = process.env.PUBLIC_URL + '/Trane.png';

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

  // State for form data
  const [formData, setFormData] = useState({
    jobNumber: '',
    sheetNumber: '',
    date: '',
    location: '',
    serialNumber: '',
    power: '',
    arrivalTime: '',
    departureTime: '',
    client: '',
    site: '',
    machineNumber: '',
    brand: '',
    interventionObject: {
      troubleshooting: '',
      maintenance: ''
    },
    reason: '',
    // Exterior unit checks
    exteriorChecks: {
      overheating: false,
      vibration: false,
      electricalConnections: false,
      electricalWiring: false,
      condenserCleaning: false,
      exteriorUnitVerification: false,
      speedDriveVerification: false
    },
    // Measurements
    measurements: {
      generalVoltage: '',
      generalCurrent: '',
      compressorCurrent: '',
      condenserFanCurrent: '',
      evaporatorFanCurrent: '',
      highPressure: '',
      lowPressure: '',
      supplyAirTemp: '',
      roomTemp: '',
      supplyAirFlow: ''
    },
    // Electrical tests
    electricalTests: {
      lowPressureSafety: false,
      highPressureSafety: false,
      forcedOperation: false,
      faultSwitchover: false
    },
    // Connections
    connections: {
      refrigerationCircuitFixation: false,
      refrigerationCircuitInsulation: false,
      electricalCircuitFixation: false
    },
    // Control box
    controlBox: {
      cleaning: false,
      electricalConnections: false,
      fuses: false,
      indicators: false,
      timer: false
    },
    // Equipment
    dismantledEquipment: [{ description: '', quantity: '' }],
    installedEquipment: [{ description: '', quantity: '' }],
    // Observations
    clientObservation: '',
    chanicObservation: '',
    // Signatures
    clientSignature: '',
    chanicSignature: ''
  });

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

        <div ref={interventionRef} className="intervention-a4-container">
          {/* Header Section */}
          <div className="intervention-header-logos">
            <img src={logoChanic} alt="GROUPE CHANIC" className="logo-chanic" />
            <div className="center-section">
              <div className="title-section">
                <h1>ENTRETIEN DEPANNAGE</h1>
                <h2>FICHE DE JOB N°</h2>
              </div>
            </div>
            <div className="right-section">
              <div className="division-info">
                <div>Division Climatisation</div>
                <div>N° Feuillet</div>
              </div>
              <img src={logoTrane} alt="TRANE" className="logo-trane" />
            </div>
          </div>

          {/* Title Row */}
          <div className="title-row-table">
            <div className="title-row-cell title-row-main">
              <input
                type="text"
                value={formData.jobNumber}
                onChange={(e) => setFormData({...formData, jobNumber: e.target.value})}
                placeholder=""
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-date">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-center">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="LOCAL/PIECE"
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-center">
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                placeholder="N° SERIE"
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-center">
              <input
                type="text"
                value={formData.power}
                onChange={(e) => setFormData({...formData, power: e.target.value})}
                placeholder="P(KW)/BTU"
                className="form-input"
              />
            </div>
          </div>

          {/* Time Row */}
          <div className="title-row-table">
            <div className="title-row-cell title-row-main">
              <input
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                placeholder="HEURE ARRIVEE"
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-date">
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                placeholder="HEURE DEPART"
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-center">
              <input
                type="text"
                value={formData.sheetNumber}
                onChange={(e) => setFormData({...formData, sheetNumber: e.target.value})}
                placeholder=""
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-center">
              <input
                type="text"
                value={formData.machineNumber}
                onChange={(e) => setFormData({...formData, machineNumber: e.target.value})}
                placeholder="N° MACHINE"
                className="form-input"
              />
            </div>
            <div className="title-row-cell title-row-center">
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                placeholder="MARQUE"
                className="form-input"
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="info-row-table">
            <div className="info-row-address">
              <div className="address-label">CLIENT</div>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="form-input"
              />
              <div className="address-label">SITE</div>
              <input
                type="text"
                value={formData.site}
                onChange={(e) => setFormData({...formData, site: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="info-row-header">OBJET INTERVENTION</div>
            <div className="info-row-header">DEPANNAGE</div>
            <div className="info-row-header">ENTRETIEN</div>
            <div className="info-row-header">RAISON</div>
            <div className="info-row-header">CLIM 1</div>
            <div className="info-row-header">CLIM 2</div>
            <div className="info-row-header">CLIM 3</div>
            <div className="info-row-header">CLIM 4</div>

            <div className="info-row-cell">
              <input
                type="text"
                value={formData.interventionObject.troubleshooting}
                onChange={(e) => setFormData({
                  ...formData,
                  interventionObject: {...formData.interventionObject, troubleshooting: e.target.value}
                })}
                className="form-input"
              />
            </div>
            <div className="info-row-cell">
              <input
                type="text"
                value={formData.interventionObject.maintenance}
                onChange={(e) => setFormData({
                  ...formData,
                  interventionObject: {...formData.interventionObject, maintenance: e.target.value}
                })}
                className="form-input"
              />
            </div>
            <div className="info-row-cell">
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Problème, écoulement eau, bruit, HS, pas de froid etc"
                className="form-input"
              />
            </div>
            <div className="info-row-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
            <div className="info-row-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
            <div className="info-row-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
            <div className="info-row-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
          </div>

          {/* Exterior Unit Section */}
          <div className="unite-coffret-combined-table">
            <div className="unite-coffret-header-main">UNITE EXTERIEURE</div>
            <div className="unite-coffret-header-section">V</div>

            <div className="unite-coffret-label">Absence échauffement</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Absence vibration</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Serrage des connexions électriques</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Dépoussiérage câblage électrique</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Nettoyage du condenseur (Eau & Produit détergent)</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Vérification de l'unité extérieure</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Vérification fonctionnement du variateur de vitesse</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
          </div>

          {/* Measurements and Tests */}
          <div className="mesure-essais-combined-table">
            <div className="mesure-essais-header-main">MESURE ET RELEVE</div>
            <div className="mesure-essais-header-clim">CLIM 1</div>
            <div className="mesure-essais-header-clim">CLIM 2</div>
            <div className="mesure-essais-header-clim">CLIM 3</div>
            <div className="mesure-essais-header-clim">CLIM 4</div>

            <div className="mesure-essais-label">Tension générale climatiseur</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Intensité générale climatiseur</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Intensité compresseur</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Intensité moteurs ventilateurs cond</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Intensité moteurs ventilateurs evap</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Haute pression (HP)</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Basse pression (BP)</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-header-section">UNITE INTERIEURE</div>
            <div className="mesure-essais-header-clim">CLIM 1</div>
            <div className="mesure-essais-header-clim">CLIM 2</div>
            <div className="mesure-essais-header-clim">CLIM 3</div>
            <div className="mesure-essais-header-clim">CLIM 4</div>

            <div className="mesure-essais-label">Température de soufflage</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Température du local</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>

            <div className="mesure-essais-label">Débit d'air de soufflage</div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
            <div className="mesure-essais-cell">
              <input type="text" className="form-input" />
            </div>
          </div>

          {/* Electrical Tests */}
          <div className="unite-coffret-combined-table">
            <div className="unite-coffret-header-main">ESSAIS ELECTRIQUE & FRIGORIFIQUE</div>
            <div className="unite-coffret-header-section">V</div>

            <div className="unite-coffret-label">Essai de la sécurité BP</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Essai de la sécurité HP</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Essai Marche forcée en cas HT°</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Essai du basculement en cas de défaut</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
          </div>

          {/* Connections */}
          <div className="interieure-liaisons-combined-table">
            <div className="interieure-liaisons-header-main">LIAISONS ELECTRIQUES ET FRIGORIFIQUES</div>
            <div className="interieure-liaisons-header-section">V</div>

            <div className="interieure-liaisons-label">Vérification fixation des circuits frigorifiques</div>
            <div className="interieure-liaisons-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="interieure-liaisons-label">Vérification calorifuge des circuits frigorifiques</div>
            <div className="interieure-liaisons-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="interieure-liaisons-label">Vérification fixation des circuits électriques</div>
            <div className="interieure-liaisons-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
          </div>

          {/* Control Box */}
          <div className="unite-coffret-combined-table">
            <div className="unite-coffret-header-main">COFFRET ELECTRIQUE COMMANDE & PUISSANCE</div>
            <div className="unite-coffret-header-section">V</div>

            <div className="unite-coffret-label">Nettoyage & Dépoussiérage coffret électrique</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Serrage des connexions électriques</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Etat des fusibles coffret de puissance</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Etat des voyants & fonctionnement sirène</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>

            <div className="unite-coffret-label">Vérification fonctionnement minuterie</div>
            <div className="unite-coffret-cell">
              <input type="checkbox" className="form-checkbox" />
            </div>
          </div>

          {/* Equipment Sections */}
          <div className="equipment-sections">
            <div className="equipment-section">
              <h3>EQUIPEMENTS DEMONTES</h3>
              <div className="equipment-table">
                <div className="equipment-header">DESCRIPTION</div>
                <div className="equipment-header">QTE</div>
                {formData.dismantledEquipment.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const newEquipment = [...formData.dismantledEquipment];
                          newEquipment[index] = {...item, description: e.target.value};
                          setFormData({...formData, dismantledEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const newEquipment = [...formData.dismantledEquipment];
                          newEquipment[index] = {...item, quantity: e.target.value};
                          setFormData({...formData, dismantledEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="equipment-section">
              <h3>EQUIPEMENTS INSTALLES</h3>
              <div className="equipment-table">
                <div className="equipment-header">DESCRIPTION</div>
                <div className="equipment-header">QTE</div>
                {formData.installedEquipment.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const newEquipment = [...formData.installedEquipment];
                          newEquipment[index] = {...item, description: e.target.value};
                          setFormData({...formData, installedEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                    <div className="equipment-cell">
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const newEquipment = [...formData.installedEquipment];
                          newEquipment[index] = {...item, quantity: e.target.value};
                          setFormData({...formData, installedEquipment: newEquipment});
                        }}
                        className="form-input"
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="compte-observations-table">
            <div className="compte-observations-header">OBSERVATION CLIENT</div>
            <div className="compte-observations-header">OBSERVATION CHANIC</div>
            <div className="compte-observations-cell">
              <textarea
                value={formData.clientObservation}
                onChange={(e) => setFormData({...formData, clientObservation: e.target.value})}
                placeholder="Constat, remarques etc"
                className="compte-observations-textarea"
              />
            </div>
            <div className="compte-observations-cell">
              <textarea
                value={formData.chanicObservation}
                onChange={(e) => setFormData({...formData, chanicObservation: e.target.value})}
                placeholder="Bruit constaté, télécommande indispo, écoulement eau etc"
                className="compte-observations-textarea"
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="signatures-table">
            <div className="signatures-header">CLIENT: nom, prénom et signature</div>
            <div className="signatures-header">CHANIC: nom, prénom et signature DES TECHNICIENS</div>
            <div className="signatures-cell">
              <input
                type="text"
                value={formData.clientSignature}
                onChange={(e) => setFormData({...formData, clientSignature: e.target.value})}
                className="signatures-input"
              />
            </div>
            <div className="signatures-cell">
              <input
                type="text"
                value={formData.chanicSignature}
                onChange={(e) => setFormData({...formData, chanicSignature: e.target.value})}
                className="signatures-input"
              />
            </div>
          </div>
        </div>
      </Box>
    </Layout>
  );
}