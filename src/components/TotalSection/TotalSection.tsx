import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import './TotalSection.scss';

interface TotalSectionProps {
  totalSuppliesHT: number;
  totalLaborHT: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
  remise?: number;
  hbc?: number;
}

const TotalSection: React.FC<TotalSectionProps> = ({
  totalSuppliesHT,
  totalLaborHT,
  totalHT,
  tva,
  totalTTC,
  remise,
  hbc
}) => {
  // Calculate original total before discount
  const originalTotalHT = Number(totalSuppliesHT ?? 0) + Number(totalLaborHT ?? 0);

  // Calculate discount amount
  const discountAmount = remise && remise > 0 ? (originalTotalHT * (remise / 100)) : 0;

  // Total after remise
  const totalAfterRemise = originalTotalHT - discountAmount;

  // Calculate HBC amount on the discounted total
  const hbcAmount = hbc && hbc > 0 ? totalAfterRemise * (hbc / 100) : 0;

  // Total after HBC and before VAT
  const totalAfterHBC = totalAfterRemise + hbcAmount;

  // Calculate VAT on total after HBC
  const vatOnTotal = totalAfterHBC * 0.16;

  // Calculate final TTC
  const finalTTC = totalAfterHBC + vatOnTotal;

  return (
    <Paper className="total-section" elevation={2}>

      <TableContainer>
        <Table size="small" aria-label="totals table">
          <TableBody>
            <TableRow>
              <TableCell className="total-label">TOTAL OFFRE USD HT:</TableCell>
              <TableCell align="right" className="total-value">{originalTotalHT.toFixed(2)}</TableCell>
            </TableRow>
            {remise && remise > 0 && (
              <TableRow>
                <TableCell className="total-label">Remise ({remise}%):</TableCell>
                <TableCell align="right" className="total-value" style={{ color: '#4caf50' }}>
                  -{discountAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            )}
            {hbc && hbc > 0 && (
              <TableRow>
                <TableCell className="total-label">HBC ({hbc}%):</TableCell>
                <TableCell align="right" className="total-value" style={{ color: '#ffa000' }}>
                  +{hbcAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell className="total-label">TOTAL HT APRÈS REMISE{hbc && hbc > 0 ? ' + HBC' : ''}:</TableCell>
              <TableCell align="right" className="total-value">{totalAfterHBC.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="total-label">TVA:</TableCell>
              <TableCell align="right" className="total-value">{vatOnTotal.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow className="grand-total-row">
              <TableCell className="total-label grand-total">TOTAL OFFRE USD TTC:</TableCell>
              <TableCell align="right" className="total-value grand-total">{finalTTC.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TotalSection;