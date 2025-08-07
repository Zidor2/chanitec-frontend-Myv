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
  return (
    <Paper className="total-section" elevation={2}>

      <TableContainer>
        <Table size="small" aria-label="totals table">
          <TableBody>
            <TableRow>
              <TableCell className="total-label">TOTAL OFFRE USD HT:</TableCell>
              <TableCell align="right" className="total-value">{Number(totalHT ?? 0).toFixed(2)}</TableCell>
            </TableRow>
            {remise && remise > 0 && (
              <TableRow>
                <TableCell className="total-label">Remise ({remise}%):</TableCell>
                <TableCell align="right" className="total-value" style={{ color: '#4caf50' }}>
                  -{((totalHT ?? 0) * (remise / 100)).toFixed(2)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell className="total-label">TVA:</TableCell>
              <TableCell align="right" className="total-value">{Number(tva ?? 0).toFixed(2)}</TableCell>
            </TableRow>
            <TableRow className="grand-total-row">
              <TableCell className="total-label grand-total">TOTAL OFFRE USD TTC:</TableCell>
              <TableCell align="right" className="total-value grand-total">{Number(totalTTC ?? 0).toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TotalSection;