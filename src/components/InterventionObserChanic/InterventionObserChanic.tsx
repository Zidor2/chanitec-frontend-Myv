import React from 'react';
import './InterventionObserChanic.css';

interface InterventionObserChanicProps {
  value?: string;
}

export default function InterventionObserChanic({ value = '' }: InterventionObserChanicProps) {
  return (
    <div className="intervention-observation-chanic" aria-label="Chanic observation block">
      <div className="observation-header-chanic">
        <span className="observation-title-chanic">OBSERVATIONS CHANIC</span>
      </div>

      <div className="observation-content-chanic">
        <textarea
          className="observation-textarea-chanic"
          value={value}
          readOnly
          aria-label="Chanic observation text area"
        />
      </div>
    </div>
  );
}
