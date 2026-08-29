import React from 'react';
import '../InterventionEquipDemont/InterventionEquipTable.css';
import { EquipmentItem } from '../../types/interventionPrint';

const EMPTY_ROWS = 4;

interface InterventionEquipInstallerProps {
  items?: EquipmentItem[];
}

export default function InterventionEquipInstaller({ items = [] }: InterventionEquipInstallerProps) {
  const rows = Array.from({ length: EMPTY_ROWS }, (_, index) => items[index] || { description: '', quantity: '' });

  return (
    <div
      className="intervention-equip-table equip-table-installer"
      aria-label="Equipements installes"
    >
      <div className="equip-title-row">
        <span className="equip-title">EQUIPEMENTS INSTALLES</span>
      </div>

      <div className="equip-header-row">
        <span className="equip-col-label">DESCRIPTION</span>
        <span className="equip-col-qte">QTE</span>
        <span className="equip-col-extra" />
      </div>

      {rows.map((item, index) => (
        <div key={index} className="equip-data-row">
          <span className="equip-cell-desc">{item.description}</span>
          <span className="equip-cell-qte">{item.quantity}</span>
          <span className="equip-cell-extra" />
        </div>
      ))}
    </div>
  );
}
