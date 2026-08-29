import React from 'react';
import './InterventionEquipTable.css';
import { EquipmentItem } from '../../types/interventionPrint';

const EMPTY_ROWS = 4;

interface InterventionEquipDemontProps {
  items?: EquipmentItem[];
}

export default function InterventionEquipDemont({ items = [] }: InterventionEquipDemontProps) {
  const rows = Array.from({ length: EMPTY_ROWS }, (_, index) => items[index] || { description: '', quantity: '' });

  return (
    <div className="intervention-equip-table" aria-label="Equipements demontes">
      <div className="equip-title-row">
        <span className="equip-title">EQUIPEMENTS DEMONTES</span>
      </div>

      <div className="equip-header-row">
        <span className="equip-col-label">DESCRIPTION</span>
        <span className="equip-col-qte">QTE</span>
      </div>

      {rows.map((item, index) => (
        <div key={index} className="equip-data-row">
          <span className="equip-cell-desc">{item.description}</span>
          <span className="equip-cell-qte">{item.quantity}</span>
        </div>
      ))}
    </div>
  );
}
