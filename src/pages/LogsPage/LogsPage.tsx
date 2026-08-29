import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Layout from '../../components/Layout/Layout';
import { apiService, ActivityLogEntry } from '../../services/api-service';
import './LogsPage.scss';

interface LogsPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR');
};

const formatDetails = (details: ActivityLogEntry['details']) => {
  if (!details) return '—';
  if (typeof details === 'string') return details;
  const parts: string[] = [];
  if (details.clientName) parts.push(`Client: ${details.clientName}`);
  if (details.siteName) parts.push(`Site: ${details.siteName}`);
  if (details.object) parts.push(`Objet: ${details.object}`);
  if (details.username) parts.push(`Compte: ${details.username}`);
  if (details.name) parts.push(`Nom: ${details.name}`);
  if (details.confirmed !== undefined) parts.push(`Confirmé: ${details.confirmed ? 'oui' : 'non'}`);
  if (details.number_chanitec) parts.push(`N°: ${details.number_chanitec}`);
  if (details.status) parts.push(`Statut: ${details.status}`);
  if (details.supplyItemsCount !== undefined) parts.push(`Fournitures: ${details.supplyItemsCount}`);
  if (details.laborItemsCount !== undefined) parts.push(`Main-d'oeuvre: ${details.laborItemsCount}`);
  if (parts.length > 0) return parts.join(' · ');
  return JSON.stringify(details);
};

const statusChip = (code: number) => {
  if (code >= 200 && code < 400) {
    return <Chip size="small" label={`${code} OK`} color="success" variant="outlined" />;
  }
  if (code === 401 || code === 403) {
    return <Chip size="small" label={`${code} Refusé`} color="warning" variant="outlined" />;
  }
  return <Chip size="small" label={`${code} Erreur`} color="error" variant="outlined" />;
};

const LogsPage: React.FC<LogsPageProps> = ({
  currentPath = '/logs',
  onNavigate,
  onLogout
}) => {
  const [items, setItems] = useState<ActivityLogEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getActivityLogs({
        page: page + 1,
        limit: rowsPerPage,
        username: filters.username.trim() || undefined,
        action: filters.action || undefined,
        status: filters.status || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le journal');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    apiService.getActivityLogActions()
      .then(setActions)
      .catch(() => setActions([]));
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setPage(0);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className="logs-page">
        <Box className="logs-page-header">
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
              Journal d'activité
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Toutes les créations, modifications, suppressions et connexions
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadLogs}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Box>

        <Paper className="logs-filters">
          <TextField
            size="small"
            label="Utilisateur"
            value={filters.username}
            onChange={(event) => handleFilterChange('username', event.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Action</InputLabel>
            <Select
              label="Action"
              value={filters.action}
              onChange={(event) => handleFilterChange('action', event.target.value)}
            >
              <MenuItem value="">Toutes les actions</MenuItem>
              {actions.map((action) => (
                <MenuItem key={action} value={action}>{action}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              label="Statut"
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="success">Réussi</MenuItem>
              <MenuItem value="error">Erreur</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="Du"
            value={filters.dateFrom}
            onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="Au"
            value={filters.dateTo}
            onChange={(event) => handleFilterChange('dateTo', event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Cible</TableCell>
                  <TableCell>Détails</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Aucune action enregistrée
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.createdAt)}</TableCell>
                      <TableCell>{item.username || '—'}</TableCell>
                      <TableCell>{item.action}</TableCell>
                      <TableCell sx={{ maxWidth: 180, wordBreak: 'break-all' }}>
                        {item.entityId || '—'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>{formatDetails(item.details)}</TableCell>
                      <TableCell>{statusChip(item.statusCode)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Lignes"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
          />
        </Paper>
      </Box>
    </Layout>
  );
};

export default LogsPage;
