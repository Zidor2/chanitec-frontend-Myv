import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EMPTY_PRINT_INTERVENTION_DATA, MeasurementKey, PrintInterventionData } from '../types/interventionPrint';
import { loadInterventionPrintData } from '../utils/loadInterventionPrintData';
import {
  mergePrintInterventionData,
  readInterventionPrintSnapshot
} from '../utils/mapInterventionFormToPrintData';
import SatisfactionRating from '../components/SatisfactionRating/SatisfactionRating';
import PrintBackgroundLogos from '../components/PrintBackgroundLogos/PrintBackgroundLogos';
import './printInterventionPage.css';

const logoChanic = process.env.PUBLIC_URL + '/CHANitec.png';
const logoTrane = process.env.PUBLIC_URL + '/Trane.png';

const UNITE_ROWS: { label: string; key: keyof PrintInterventionData['exteriorChecks'] }[] = [
  { label: 'Absence échauffement', key: 'overheating' },
  { label: 'Absence vibration', key: 'vibration' },
  { label: 'Serrage des connexions électriques', key: 'electricalConnections' },
  { label: 'Dépoussiérage câblage électrique', key: 'electricalWiring' },
  { label: 'Nettoyage du condenseur (Eau & Produit détergent)', key: 'condenserCleaning' },
  { label: "Vérification de l'unité extérieure", key: 'exteriorUnitVerification' },
  { label: 'Vérification fonctionnement du variateur de vitesse', key: 'speedDriveVerification' }
];

const COFFRET_ROWS: { label: string; key: keyof PrintInterventionData['controlBox'] }[] = [
  { label: 'Nettoyage & Dépoussiérage coffret électrique', key: 'cleaning' },
  { label: 'Serrage des connexions électriques', key: 'electricalConnections' },
  { label: 'Etat des fusibles coffret de puissance', key: 'fuses' },
  { label: 'Etat des voyants & fonctionnement sirène', key: 'indicators' },
  { label: 'Vérification fonctionnement minuterie', key: 'timer' }
];

const ESSAI_ROWS: { label: string; key: keyof PrintInterventionData['electricalTests'] }[] = [
  { label: 'Essai de la sécurité BP', key: 'lowPressureSafety' },
  { label: 'Essai de la sécurité HP', key: 'highPressureSafety' },
  { label: 'Essai Marche forcée en cas HT°', key: 'forcedOperation' },
  { label: 'Essai du basculement en cas de défaut', key: 'faultSwitchover' }
];

const LIAISON_ROWS: { label: string; key: keyof PrintInterventionData['connections'] | null }[] = [
  { label: 'Vérification fixation des circuits frigorifiques', key: 'refrigerationCircuitFixation' },
  { label: 'Vérification calorifuge des circuits frigorifiques', key: 'refrigerationCircuitInsulation' },
  { label: 'Vérification fixation des circuits électriques', key: 'electricalCircuitFixation' },
  { label: '', key: null }
];

const MESURE_ROWS: { label: string; key: MeasurementKey }[] = [
  { label: 'Tension générale climatiseur', key: 'generalVoltage' },
  { label: 'Intensité générale climatiseur', key: 'generalCurrent' },
  { label: 'Intensité compresseur', key: 'compressorCurrent' },
  { label: 'Intensité moteurs ventilateurs cond.', key: 'condenserFanCurrent' },
  { label: 'Intensité moteurs ventilateurs evap.', key: 'evaporatorFanCurrent' },
  { label: 'Haute pression (HP)', key: 'highPressure' },
  { label: 'Basse pression (BP)', key: 'lowPressure' },
  { label: 'Température de soufflage', key: 'supplyAirTemp' },
  { label: 'Température du local', key: 'roomTemp' },
  { label: "Débit d'air de soufflage", key: 'supplyAirFlow' }
];

function Tick({ checked }: { checked: boolean }) {
  return (
    <span className={`tick-box${checked ? ' is-on' : ''}`} aria-hidden="true">
      {checked ? '✓' : ''}
    </span>
  );
}

function padEquipment(items: PrintInterventionData['dismantledEquipment'], count: number) {
  const next = items.slice(0, count);
  while (next.length < count) {
    next.push({ description: '', quantity: '' });
  }
  return next;
}

function CheckTable({
  title,
  rows
}: {
  title: string;
  rows: { label: string; checked: boolean }[];
}) {
  return (
    <div className="sheet-wrap">
      <table className="sheet-table check-table">
        <thead>
          <tr>
            <th className="section-head">{title}</th>
            <th className="section-head check-head">v</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <td>{row.label}</td>
              <td className="check-cell">{row.checked ? '✓' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PrintInterventionPageProps {
  currentPath?: string;
  onNavigate?: (path: string, quoteId?: string) => void;
  onLogout?: () => void;
}

export default function PrintInterventionPage({
  currentPath = '/intervention/print',
  onNavigate,
  onLogout
}: PrintInterventionPageProps) {
  const { id } = useParams<{ id?: string }>();
  const pageRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<PrintInterventionData>(EMPTY_PRINT_INTERVENTION_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setPrintData(EMPTY_PRINT_INTERVENTION_DATA);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const snapshot = readInterventionPrintSnapshot(id);
    if (snapshot) {
      setPrintData(snapshot);
    }

    loadInterventionPrintData(id)
      .then((apiData) => {
        if (cancelled) return;
        // Prefer the live form snapshot from Imprimer, fill gaps from API
        setPrintData(mergePrintInterventionData(snapshot, apiData));
      })
      .catch((error) => {
        console.error('Error loading intervention for print page:', error);
        if (!cancelled && snapshot) {
          setPrintData(snapshot);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePrint = () => {
    if (isLoading) return;

    document.body.classList.add('printing-intervention');

    let pageStyle = document.getElementById('intervention-print-page-style') as HTMLStyleElement | null;
    if (!pageStyle) {
      pageStyle = document.createElement('style');
      pageStyle.id = 'intervention-print-page-style';
      pageStyle.textContent = '@page { size: A4 landscape; margin: 0; }';
      document.head.appendChild(pageStyle);
    }

    const cleanup = () => {
      document.body.classList.remove('printing-intervention');
      pageStyle?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
        window.setTimeout(cleanup, 2000);
      }, 50);
    });
  };

  const objectValue = (printData.interventionObject || '').toUpperCase();
  const isDepannage = objectValue.includes('DEPANNAGE');
  const isEntretien = objectValue.includes('ENTRETIEN');
  const dismantled = padEquipment(printData.dismantledEquipment, 4);
  const installed = padEquipment(printData.installedEquipment, 4);

  return (
    <div className="print-intervention-page page-shell">
      <div className="layout-toolbar">
        <button
          type="button"
          className="back-btn"
          onClick={() => {
            if (onNavigate && id) {
              onNavigate(`/intervention/${id}`);
              return;
            }
            if (window.history.length > 1) {
              window.history.back();
              return;
            }
            onNavigate?.('/interventions');
          }}
        >
          Retour
        </button>
        <button type="button" className="print-btn" onClick={handlePrint} disabled={isLoading}>
          {isLoading ? 'Chargement…' : 'Print'}
        </button>
      </div>

      <div className="a4-page" ref={pageRef}>
        <PrintBackgroundLogos />
        <div className="print-page-header">
          <img src={logoChanic} alt="GROUPE CHANIC" className="print-header-logo-chanic" />
          <div className="print-header-center">
            <div className="print-header-title">ENTRETIEN DEPANNAGE</div>
            <div className="print-header-subtitle">FICHE DE JOB N°</div>
            <input className="print-header-job-input" value={printData.jobNumber} readOnly aria-label="Fiche de job number" />
          </div>
          <div className="print-header-feuillet">
            <div className="print-header-division">Division Climatisation</div>
            <div className="print-header-feuillet-label">N° Feuillet</div>
            <input className="print-header-feuillet-input" value={printData.sheetNumber} readOnly aria-label="Sheet number" />
          </div>
          <img src={logoTrane} alt="TRANE" className="print-header-logo-trane" />
        </div>

        <div className="form-sheet">
          <table className="sheet-table info-table">
            <colgroup>
              <col className="label" />
              <col className="wide" />
              <col className="mid" />
              <col className="wide" />
              <col className="time-label" />
              <col className="time" />
            </colgroup>
            <tbody>
              <tr>
                <td className="label-cell">Client</td>
                <td className="value-cell">{printData.client}</td>
                <td className="label-cell">Date</td>
                <td className="value-cell">{printData.date}</td>
                <td className="label-cell">Heure arrivée</td>
                <td className="value-cell">{printData.arrivalTime}</td>
              </tr>
              <tr>
                <td className="label-cell">Site</td>
                <td className="value-cell">{printData.site}</td>
                <td className="label-cell">Local/Pièce</td>
                <td className="value-cell">{printData.location}</td>
                <td className="label-cell">Heure départ</td>
                <td className="value-cell">{printData.departureTime}</td>
              </tr>
              <tr>
                <td className="label-cell">N° machine</td>
                <td className="value-cell">{printData.machineNumber}</td>
                <td className="label-cell">N° série</td>
                <td className="value-cell" colSpan={3}>{printData.serialNumber}</td>
              </tr>
              <tr>
                <td className="label-cell">Marque</td>
                <td className="value-cell">{printData.brand}</td>
                <td className="label-cell">P(KW)/BTU</td>
                <td className="value-cell" colSpan={3}>{printData.power}</td>
              </tr>
            </tbody>
          </table>

          <table className="sheet-table info-table object-table">
            <colgroup>
              <col className="object-label" />
              <col className="object-choice" />
              <col className="raison-label" />
              <col className="raison-value" />
            </colgroup>
            <tbody>
              <tr className="object-row">
                <td className="label-cell" rowSpan={2}>Objet intervention</td>
                <td>
                  <div className="object-option">
                    <span>Dépannage</span>
                    <Tick checked={isDepannage} />
                  </div>
                </td>
                <td className="label-cell" rowSpan={2}>Raison</td>
                <td className="value-cell reason-cell" rowSpan={2}>
                  {printData.reason || (
                    <span className="placeholder">Problème, écoulement eau, bruit, HS, pas de froid etc</span>
                  )}
                </td>
              </tr>
              <tr className="object-row">
                <td>
                  <div className="object-option">
                    <span>Entretien</span>
                    <Tick checked={isEntretien} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="body-split">
            <div className="body-left">
              <CheckTable
                title="Unité extérieure"
                rows={UNITE_ROWS.map((row) => ({ label: row.label, checked: printData.exteriorChecks[row.key] }))}
              />
              <CheckTable
                title="Coffret électrique commande & puissance"
                rows={COFFRET_ROWS.map((row) => ({ label: row.label, checked: printData.controlBox[row.key] }))}
              />
            </div>

            <div className="body-right">
              <div className="sheet-wrap">
                <table className="sheet-table mesure-table">
                  <colgroup>
                    <col className="metric" />
                    <col className="clim" />
                    <col className="clim" />
                    <col className="clim" />
                    <col className="clim" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="section-head">Mesure et relevé</th>
                      <th className="clim-head">CLIM 1</th>
                      <th className="clim-head">CLIM 2</th>
                      <th className="clim-head">CLIM 3</th>
                      <th className="clim-head">CLIM 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MESURE_ROWS.map((row) => (
                      <tr key={row.key}>
                        <td>{row.label}</td>
                        {[0, 1, 2, 3].map((index) => (
                          <td key={index}>{printData.measurements[row.key]?.[index] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="body-right-split">
                <CheckTable
                  title="Essais électrique & frigorifique"
                  rows={ESSAI_ROWS.map((row) => ({ label: row.label, checked: printData.electricalTests[row.key] }))}
                />
                <CheckTable
                  title="Liaisons électriques et frigorifiques"
                  rows={LIAISON_ROWS.map((row) => ({
                    label: row.label,
                    checked: row.key ? printData.connections[row.key] : false
                  }))}
                />
              </div>

              <div className="body-right-split">
                <div className="sheet-wrap">
                  <table className="sheet-table equip-table">
                    <colgroup>
                      <col className="desc" />
                      <col className="qty" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="section-head" colSpan={2}>Equipements démontés</th>
                      </tr>
                      <tr>
                        <th className="section-head">Description</th>
                        <th className="section-head qty-head">QTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dismantled.map((item, index) => (
                        <tr key={`d-${index}`}>
                          <td>{item.description}</td>
                          <td className="qty-cell">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="sheet-wrap">
                  <table className="sheet-table equip-table">
                    <colgroup>
                      <col className="desc" />
                      <col className="qty" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="section-head" colSpan={2}>Equipements installés</th>
                      </tr>
                      <tr>
                        <th className="section-head">Description</th>
                        <th className="section-head qty-head">QTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installed.map((item, index) => (
                        <tr key={`i-${index}`}>
                          <td>{item.description}</td>
                          <td className="qty-cell">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="obs-row">
            <div className="obs-box">
              <div className="obs-head">Observation client</div>
              <div className="obs-body">
                <SatisfactionRating
                  ariaLabel="Satisfaction client"
                  value={printData.clientObservation}
                  readOnly
                />
              </div>
            </div>
            <div className="obs-box">
              <div className="obs-head">Observation Chanic</div>
              <div className="obs-body">
                <SatisfactionRating
                  ariaLabel="Satisfaction Chanic"
                  value={printData.chanicObservation}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="sign-row">
            <div className="sign-box">
              <div className="sign-head">Client : nom, prénom et signature</div>
              <div className="sign-body">{printData.clientSignature}</div>
            </div>
            <div className="sign-box">
              <div className="sign-head">Chanic : nom, prénom et signature des techniciens</div>
              <div className="sign-body">{printData.chanicSignature}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
