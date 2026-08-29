import React from 'react';
import '../InterventionUniteExterieure/InterventionUniteExterieure.css';
import { PrintInterventionData } from '../../types/interventionPrint';

const rows: { label: string; key: keyof PrintInterventionData['controlBox'] }[] = [
  { label: 'Nettoyage & Dépoussierage coffret électrique', key: 'cleaning' },
  { label: 'Serrage des connexions électriques', key: 'electricalConnections' },
  { label: 'Etat des fusibles coffret de puissance', key: 'fuses' },
  { label: 'Etat des voyants & fonctionnement sirène', key: 'indicators' },
  { label: 'Vérification fonctionnement minuterie', key: 'timer' }
];

interface InterventionCoffretElectProps {
  data?: PrintInterventionData;
}

export default function InterventionCoffretElect({ data }: InterventionCoffretElectProps) {
  return (
    <div className="intervention-unite-exterieure" aria-label="Coffret electrique commande & puissance">
      <div className="unite-header">
        <span className="unite-title">COFFRET ELECTRIQUE COMMANDE &amp; PUISSANCE</span>
        <span className="check-cell checked">✓</span>
      </div>

      {rows.map((row) => {
        const checked = Boolean(data?.controlBox[row.key]);
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
}
