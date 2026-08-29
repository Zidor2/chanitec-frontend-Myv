import React from 'react';
import '../InterventionUniteExterieure/InterventionUniteExterieure.css';
import { PrintInterventionData } from '../../types/interventionPrint';

const rows: { label: string; key: keyof PrintInterventionData['connections'] | null }[] = [
  { label: 'Vérification fixation des circuits frigorifiques', key: 'refrigerationCircuitFixation' },
  { label: 'Vérification calorifuge des circuits frigorifiques', key: 'refrigerationCircuitInsulation' },
  { label: 'Vérification fixation des circuits électriques', key: 'electricalCircuitFixation' },
  { label: '', key: null }
];

interface InterventionLiaisonElecFrigoProps {
  data?: PrintInterventionData;
}

export default function InterventionLiaisonElecFrigo({ data }: InterventionLiaisonElecFrigoProps) {
  return (
    <div className="intervention-unite-exterieure" aria-label="Liaisons electriques et frigorifiques">
      <div className="unite-header">
        <span className="unite-title">LIAISONS ELECTRIQUES ET FRIGORIFIQUES</span>
        <span className="check-cell checked">✓</span>
      </div>

      {rows.map((row, idx) => {
        const checked = row.key ? Boolean(data?.connections[row.key]) : false;
        return (
          <div key={idx} className="unite-row">
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
