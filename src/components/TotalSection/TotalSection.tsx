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
}

const TotalSection: React.FC<TotalSectionProps> = ({
  totalSuppliesHT,
  totalLaborHT,
  totalHT,
  tva,
  totalTTC,
  remise
}) => {
  // Calculate original total before discount
  const originalTotalHT = Number(totalSuppliesHT ?? 0) + Number(totalLaborHT ?? 0);

  // Calculate discount amount
  const discountAmount = remise && remise > 0 ? (originalTotalHT * (remise / 100)) : 0;

  // Calculate discounted total
  const discountedTotalHT = originalTotalHT - discountAmount;

  // Calculate VAT on discounted total
  const vatOnDiscounted = discountedTotalHT * 0.16;

  // Calculate final TTC
  const finalTTC = discountedTotalHT + vatOnDiscounted;

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
            <TableRow>
              <TableCell className="total-label">TOTAL HT APRÈS REMISE:</TableCell>
              <TableCell align="right" className="total-value">{discountedTotalHT.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="total-label">TVA:</TableCell>
              <TableCell align="right" className="total-value">{vatOnDiscounted.toFixed(2)}</TableCell>
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