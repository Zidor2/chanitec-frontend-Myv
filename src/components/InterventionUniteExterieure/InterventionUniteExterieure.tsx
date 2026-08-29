import React from 'react';
import './InterventionUniteExterieure.css';
import { PrintInterventionData } from '../../types/interventionPrint';

const rows: { label: string; key: keyof PrintInterventionData['exteriorChecks'] }[] = [
  { label: 'Absence échauffement', key: 'overheating' },
  { label: 'Absence vibration', key: 'vibration' },
  { label: 'Serrage des connexions électriques', key: 'electricalConnections' },
  { label: 'Dépoussierage câblage électrique', key: 'electricalWiring' },
  { label: 'Nettoyage du condenseur (Eau & Produit détergent)', key: 'condenserCleaning' },
  { label: "Vérification de l'unité extérieure", key: 'exteriorUnitVerification' },
  { label: 'Vérification fonctionnement du variateur de vitesse', key: 'speedDriveVerification' }
];

interface InterventionUniteExterieureProps {
  data?: PrintInterventionData;
}

const InterventionUniteExterieure: React.FC<InterventionUniteExterieureProps> = ({ data }) => {
  return (
    <div className="intervention-unite-exterieure" aria-label="Unité extérieure block">
      <div className="unite-header">
        <span className="unite-title">UNITE EXTERIEURE</span>
        <span className="check-cell checked">✓</span>
      </div>

      {rows.map((row) => {
        const checked = Boolean(data?.exteriorChecks[row.key]);
        return (
          <div key={row.label} className="unite-row">
            <span className="unite-label">{row.label}</span>
            <span className={`check-cell ${checked ? 'checked' : 'empty'}`} aria-label={checked ? 'checked' : 'unchecked'}>
              {checked ? '✓' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default InterventionUniteExterieure;
