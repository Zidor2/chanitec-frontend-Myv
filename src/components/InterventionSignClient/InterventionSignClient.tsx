import React from 'react';
import '../InterventionUniteExterieure/InterventionUniteExterieure.css';

interface InterventionSignClientProps {
  value?: string;
}

export default function InterventionSignClient({ value = '' }: InterventionSignClientProps) {
  return (
    <div className="intervention-unite-exterieure" aria-label="Client signature block">
      <div className="unite-header">
        <span className="unite-title">CLIENT : nom, prénom et signature</span>
        <span className="check-cell checked" />
      </div>

      <div className="unite-row" style={{ minHeight: '54px' }}>
        <span className="unite-label">{value || '\u00A0'}</span>
        <span className="check-cell empty" aria-label="unchecked" />
      </div>
    </div>
  );
}
