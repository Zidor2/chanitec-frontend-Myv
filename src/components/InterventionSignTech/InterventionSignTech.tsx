import React from 'react';
import '../InterventionUniteExterieure/InterventionUniteExterieure.css';

interface InterventionSignTechProps {
  value?: string;
}

export default function InterventionSignTech({ value = '' }: InterventionSignTechProps) {
  return (
    <div className="intervention-unite-exterieure" aria-label="Technicians signature block">
      <div className="unite-header">
        <span className="unite-title">CHANIC : nom, prénom et signature DES TECHNICIENS</span>
        <span className="check-cell checked" />
      </div>

      <div className="unite-row" style={{ minHeight: '54px' }}>
        <span className="unite-label">{value || '\u00A0'}</span>
        <span className="check-cell empty" aria-label="unchecked" />
      </div>
    </div>
  );
}
