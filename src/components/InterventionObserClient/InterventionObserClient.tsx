import React from 'react';
import './InterventionObserClient.css';

interface InterventionObserClientProps {
  value?: string;
}

export default function InterventionObserClient({ value = '' }: InterventionObserClientProps) {
  return (
    <div className="intervention-observation" aria-label="Client observation block">
      <div className="observation-header">
        <span className="observation-title">OBSERVATIONS CLIENT</span>
      </div>

      <div className="observation-content">
        <textarea
          className="observation-textarea"
          value={value}
          readOnly
          aria-label="Client observation text area"
        />
      </div>
    </div>
  );
}
