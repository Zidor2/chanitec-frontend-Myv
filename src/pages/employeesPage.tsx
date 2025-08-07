import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
  Button,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { employeeService, Employee, CreateEmployeeDTO } from '../services/employee-service';
import Layout from '../components/Layout/Layout';
import './employeesPage.scss';
import dayjs from 'dayjs';

const civilStatusOptions = ['C', 'M']; // Celibataire, Marié
const contractTypeOptions = ['CDI', 'CDD', 'Interim'];

interface EmployeesPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const EmployeesPage: React.FC<EmployeesPageProps> = ({ 
  currentPath = '/employees', 
  onNavigate, 
  onLogout 
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<CreateEmployeeDTO>({
    full_name: '',
    civil_status: '',
    birth_date: '',
    entry_date: '',
    seniority: '',
    contract_type: '',
    job_title: '',
    fonction: '',
    sub_type_id: undefined,
    type_description: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
      setError(null);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        full_name: employee.full_name,
        civil_status: employee.civil_status,
        birth_date: employee.birth_date,
        entry_date: employee.entry_date,
        seniority: employee.seniority,
        contract_type: employee.contract_type,
        job_title: employee.job_title,
        fonction: employee.fonction,
        sub_type_id: employee.sub_type_id,
        type_description: employee.type_description,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        full_name: '',
        civil_status: '',
        birth_date: '',
        entry_date: '',
        seniority: '',
        contract_type: '',
        job_title: '',
        fonction: '',
        sub_type_id: undefined,
        type_description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setFormData({
      full_name: '',
      civil_status: '',
      birth_date: '',
      entry_date: '',
      seniority: '',
      contract_type: '',
      job_title: '',
      fonction: '',
      sub_type_id: undefined,
      type_description: '',
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, formData);
      } else {
        await employeeService.createEmployee(formData);
      }
      await loadEmployees();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        await loadEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  const calculateSeniority = (entryDate: string) => {
    if (!entryDate) return '';
    const entry = dayjs(entryDate);
    const now = dayjs();
    const years = now.diff(entry, 'year');
    const months = now.diff(entry, 'month') % 12;
    return `${years}y ${months}m`;
  };

  const getTypeDescription = (subTypeId: number | undefined) => {
    switch (subTypeId) {
      case 1:
        return 'Chef de service Chargé de clim-domestique';
      case 2:
        return 'Polyvalent';
      case 3:
      case 4:
      case 5:
        return 'Chef de service adj chargé du climatisation centralisé';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
        <Box sx={{ p: 3, color: 'error.main' }}>
          Error: {error}
        </Box>
      </Layout>
    );
  }

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="employees-container">
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Gestion des Employés
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mb: 2 }}
          >
            Ajouter un employé
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom complet</TableCell>
                  <TableCell>Statut civil</TableCell>
                  <TableCell>Poste</TableCell>
                  <TableCell>Fonction</TableCell>
                  <TableCell>Type de contrat</TableCell>
                  <TableCell>Ancienneté</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.full_name}</TableCell>
                    <TableCell>{employee.civil_status}</TableCell>
                    <TableCell>{employee.job_title}</TableCell>
                    <TableCell>{employee.fonction}</TableCell>
                    <TableCell>{employee.contract_type}</TableCell>
                    <TableCell>{calculateSeniority(employee.entry_date)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(employee)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(employee.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingEmployee ? 'Modifier l\'employé' : 'Ajouter un nouvel employé'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="full_name"
                label="Nom complet"
                value={formData.full_name}
                onChange={handleTextChange}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Statut civil</InputLabel>
                <Select
                  name="civil_status"
                  value={formData.civil_status}
                  onChange={handleSelectChange}
                  label="Statut civil"
                >
                  {civilStatusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status === 'C' ? 'Célibataire' : 'Marié'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                name="birth_date"
                label="Date de naissance"
                type="date"
                value={formData.birth_date}
                onChange={handleTextChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="entry_date"
                label="Date d'entrée"
                type="date"
                value={formData.entry_date}
                onChange={handleTextChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="job_title"
                label="Poste"
                value={formData.job_title}
                onChange={handleTextChange}
                fullWidth
              />
              <TextField
                name="fonction"
                label="Fonction"
                value={formData.fonction}
                onChange={handleTextChange}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Type de contrat</InputLabel>
                <Select
                  name="contract_type"
                  value={formData.contract_type}
                  onChange={handleSelectChange}
                  label="Type de contrat"
                >
                  {contractTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingEmployee ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EmployeesPage;