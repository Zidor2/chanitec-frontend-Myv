import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { authService, User } from '../../services/auth-service';
import {
  PAGE_DEFINITIONS,
  applyAllPermission,
  canManageUsers,
  hasAllAccess,
  isPageChecked,
  normalizePermissions,
  togglePagePermission
} from '../../constants/pagePermissions';
import './UsersPage.scss';

interface UsersPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const emptyForm = {
  username: '',
  password: '',
  permissions: ['home'] as string[]
};

const UsersPage: React.FC<UsersPageProps> = ({
  currentPath = '/users',
  onNavigate,
  onLogout
}) => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>('');

  const canEditUsers = canManageUsers(currentUser);

  useEffect(() => {
    if (!authLoading && !canEditUsers) {
      onNavigate?.('/home');
    }
  }, [authLoading, canEditUsers, onNavigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEditUsers) {
      loadUsers();
    }
  }, [canEditUsers]);

  const handleOpenDialog = () => {
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleCreate = async () => {
    if (!formData.username.trim() || !formData.password) {
      setError("Nom d'utilisateur et mot de passe requis");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await authService.createUser(formData.username.trim(), formData.password, formData.permissions);
      setDialogOpen(false);
      setFormData(emptyForm);
      setNotice('Utilisateur créé');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionsChange = async (target: User, permissions: string[]) => {
    if (target.id === currentUser?.id) {
      setError('Vous ne pouvez pas modifier vos propres accès');
      return;
    }

    try {
      setUpdatingId(target.id);
      setError(null);
      const updated = await authService.updateUser(target.id, {
        username: target.username,
        permissions
      });
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setNotice(`Accès de ${target.username} mis à jour`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (target: User) => {
    if (target.id === currentUser?.id) {
      setError('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    const confirmed = window.confirm(`Supprimer l'utilisateur « ${target.username} » ?`);
    if (!confirmed) return;

    try {
      setError(null);
      await authService.deleteUser(target.id);
      setUsers((prev) => prev.filter((item) => item.id !== target.id));
      setNotice(`Utilisateur ${target.username} supprimé`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible');
    }
  };

  const renderAccessEditor = (
    permissions: string[],
    onChange: (next: string[]) => void,
    disabled: boolean
  ) => {
    const allChecked = hasAllAccess(permissions);

    return (
      <div className="users-access-grid">
        <FormControlLabel
          className="users-access-all"
          control={
            <Checkbox
              checked={allChecked}
              disabled={disabled}
              onChange={(event) => onChange(applyAllPermission(event.target.checked))}
            />
          }
          label="Tout"
        />
        {PAGE_DEFINITIONS.map((page) => (
          <FormControlLabel
            key={page.key}
            control={
              <Checkbox
                checked={page.key === 'home' || isPageChecked(permissions, page.key)}
                disabled={disabled || page.key === 'home'}
                onChange={(event) => onChange(togglePagePermission(permissions, page.key, event.target.checked))}
              />
            }
            label={page.label}
          />
        ))}
      </div>
    );
  };

  if (authLoading || !canEditUsers) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          {authLoading ? <CircularProgress /> : <Alert severity="warning">Accès réservé à la gestion des utilisateurs.</Alert>}
        </Box>
      </Layout>
    );
  }

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="users-page">
        <Box sx={{ p: 3 }}>
          <Box className="users-page-header">
            <Box>
              <Typography variant="h4" gutterBottom>
                Utilisateurs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Créez des comptes et donnez l'accès page par page, ou tout d'un coup.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
              Nouvel utilisateur
            </Button>
          </Box>

          {error && !dialogOpen && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom d'utilisateur</TableCell>
                    <TableCell>Accès aux pages</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((item) => {
                    const isSelf = item.id === currentUser?.id;
                    const permissions = normalizePermissions(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell sx={{ verticalAlign: 'top', width: 180 }}>
                          {item.username}
                          {isSelf ? <Chip label="Vous" size="small" sx={{ ml: 1 }} /> : null}
                          {hasAllAccess(permissions) ? (
                            <Chip label="Tout" size="small" color="primary" sx={{ ml: 1 }} />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {renderAccessEditor(
                            permissions,
                            (next) => handlePermissionsChange(item, next),
                            isSelf || updatingId === item.id
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                          <Tooltip title={isSelf ? 'Impossible de supprimer votre compte' : 'Supprimer'}>
                            <span>
                              <IconButton
                                color="error"
                                disabled={isSelf}
                                onClick={() => handleDelete(item)}
                                aria-label={`Supprimer ${item.username}`}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>Aucun utilisateur.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && dialogOpen && (
                <Alert severity="error">{error}</Alert>
              )}
              <TextField
                label="Nom d'utilisateur"
                value={formData.username}
                onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                fullWidth
                autoFocus
                required
              />
              <TextField
                label="Mot de passe"
                type="password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                fullWidth
                required
              />
              <Typography variant="subtitle2">Accès aux pages</Typography>
              {renderAccessEditor(
                formData.permissions,
                (permissions) => setFormData({ ...formData, permissions }),
                saving
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={saving}>Annuler</Button>
            <Button onClick={handleCreate} variant="contained" disabled={saving}>
              {saving ? 'Création...' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!notice}
          autoHideDuration={4000}
          onClose={() => setNotice('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>
            {notice}
          </Alert>
        </Snackbar>
      </div>
    </Layout>
  );
};

export default UsersPage;
