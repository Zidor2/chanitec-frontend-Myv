import React from 'react';
import '../InterventionUniteExterieure/InterventionUniteExterieure.css';
import { PrintInterventionData } from '../../types/interventionPrint';

const rows: { label: string; key: keyof PrintInterventionData['electricalTests'] }[] = [
  { label: 'Essai de la sécurité BP', key: 'lowPressureSafety' },
  { label: 'Essai de la sécurité HP', key: 'highPressureSafety' },
  { label: 'Essai Marche forcée en cas HT°', key: 'forcedOperation' },
  { label: 'Essai du basculement en cas de défaut', key: 'faultSwitchover' }
];

interface EssaiElecFrigoProps {
  data?: PrintInterventionData;
}

export default function EssaiElecFrigo({ data }: EssaiElecFrigoProps) {
  return (
    <div className="intervention-unite-exterieure" aria-label="Essais electrique et frigorifique">
      <div className="unite-header">
        <span className="unite-title">ESSAIS ELECTRIQUE &amp; FRIGORIFIQUE</span>
        <span className="check-cell checked">✓</span>
      </div>

      {rows.map((row) => {
        const checked = Boolean(data?.electricalTests[row.key]);
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
