import React from 'react';
import './InterventionInfo.css';
import { PrintInterventionData } from '../../types/interventionPrint';

interface InterventionInfoProps {
  data?: PrintInterventionData;
}

const InterventionInfo: React.FC<InterventionInfoProps> = ({ data }) => {
  const objectValue = (data?.interventionObject || '').toUpperCase();
  const isDepannage = objectValue.includes('DEPANNAGE');
  const isEntretien = objectValue.includes('ENTRETIEN');

  return (
    <div className="intervention-info" aria-label="Intervention information block">
      <div className="info-column">
        <div className="info-row label-row">Client</div>
        <div className="info-row value-row">{data?.client}</div>
        <div className="info-row label-row label-with-value">
          <span>N° machine</span>
          <span className="inline-value">{data?.machineNumber}</span>
        </div>
        <div className="info-row label-row label-with-value">
          <span>Marque</span>
          <span className="inline-value">{data?.brand}</span>
        </div>
        <div className="info-row object-row">
          <div className="object-label">Objet intervention</div>
          <div className="object-sub">
            <div className={`object-sub-cell${isDepannage ? ' is-selected' : ''}`}>
              Dépannage{isDepannage ? ' ✓' : ''}
            </div>
            <div className={`object-sub-cell${isEntretien ? ' is-selected' : ''}`}>
              Entretien{isEntretien ? ' ✓' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="info-column">
        <div className="info-row label-row">Date</div>
        <div className="info-row value-row">{data?.date}</div>
        <div className="info-row label-row label-with-value">
          <span>N° série</span>
          <span className="inline-value">{data?.serialNumber}</span>
        </div>
        <div className="info-row label-row label-with-value">
          <span>P(KW)/BTU</span>
          <span className="inline-value">{data?.power}</span>
        </div>
        <div className="info-row reason-row">
          <div className="reason-label">Raison</div>
          <div className="reason-empty">
            {data?.reason || 'Problème, écoulement eau, bruit, HS, pas de froid etc'}
          </div>
        </div>
      </div>

      <div className="info-column">
        <div className="info-row label-row label-with-value">
          <span>Heure arrivée</span>
          <span className="inline-value">{data?.arrivalTime}</span>
        </div>
        <div className="info-row label-row label-with-value">
          <span>Heure départ</span>
          <span className="inline-value">{data?.departureTime}</span>
        </div>
        <div className="info-row label-row label-with-value">
          <span>Site</span>
          <span className="inline-value">{data?.site}</span>
        </div>
        <div className="info-row label-row label-with-value">
          <span>Local</span>
          <span className="inline-value">{data?.location}</span>
        </div>
        <div className="info-row label-row label-with-value">
          <span>N° feuillet</span>
          <span className="inline-value">{data?.sheetNumber || data?.jobNumber}</span>
        </div>
      </div>
    </div>
  );
};

export default InterventionInfo;
