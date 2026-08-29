import React from 'react';
import './MesureEtReleve.css';
import { MeasurementKey, PrintInterventionData } from '../../types/interventionPrint';

const rows: { label: string; key: MeasurementKey }[] = [
  { label: 'Tension générale climatiser', key: 'generalVoltage' },
  { label: 'Intensité générale climatiseur', key: 'generalCurrent' },
  { label: 'Intensité compresseur', key: 'compressorCurrent' },
  { label: 'Intensité moteurs ventilateurs cond', key: 'condenserFanCurrent' },
  { label: 'Intensité moteurs ventilateurs evap', key: 'evaporatorFanCurrent' },
  { label: 'Haute pression (HP)', key: 'highPressure' },
  { label: 'Basse pression (BP)', key: 'lowPressure' },
  { label: 'Température de soufflage', key: 'supplyAirTemp' },
  { label: 'Température du local', key: 'roomTemp' },
  { label: 'Débit d’air de soufflage', key: 'supplyAirFlow' }
];

interface MesureEtReleveProps {
  data?: PrintInterventionData;
}

const MesureEtReleve: React.FC<MesureEtReleveProps> = ({ data }) => {
  return (
    <div className="mesure-et-releve" aria-label="Mesure et relevé block">
      <div className="table-header">
        <div className="header-title">MESURE ET RELEVE</div>
        <div className="header-column">CLIM 1</div>
        <div className="header-column">CLIM 2</div>
        <div className="header-column">CLIM 3</div>
        <div className="header-column">CLIM 4</div>
      </div>

      {rows.map((row) => (
        <div key={row.key} className="table-row">
          <div className="metric-label">{row.label}</div>
          {[0, 1, 2, 3].map((index) => (
            <div className="metric-cell" key={`${row.key}-${index}`}>
              {data?.measurements[row.key]?.[index] || ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MesureEtReleve;
