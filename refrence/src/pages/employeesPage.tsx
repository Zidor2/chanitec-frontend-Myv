import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeService, Employee, CreateEmployeeDTO } from '../services/employee-service';
import './employeesPage.scss';
import dayjs from 'dayjs';

const civilStatusOptions = ['C', 'M']; // Celibataire, Marié
const contractTypeOptions = ['CDI', 'CDD', 'Interim'];

const EmployeesPage = () => {
  const navigate = useNavigate();
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
      setError('Failed to save employee');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        await loadEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
        setError('Failed to delete employee');
      }
    }
  };

  const calculateSeniority = (entryDate: string) => {
    if (!entryDate) return '';
    const start = dayjs(entryDate);
    const end = dayjs();
    const years = end.diff(start, 'year');
    const months = end.diff(start.add(years, 'year'), 'month');
    const days = end.diff(start.add(years, 'year').add(months, 'month'), 'day');
    return `${years} years ${months} months ${days} days`;
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        Error: {error}
      </Box>
    );
  }

  return (
    <div className="employees-container">
      <AppBar position="static" color="primary">
        <Toolbar>
          <Button color="inherit" onClick={() => navigate('/org-chart')}>
            Back to Org Chart
          </Button>
          <Typography variant="h6" style={{ marginLeft: '20px' }}>
            Employees Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mb: 2 }}
        >
          Add Employee
        </Button>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Full Name</TableCell>
                <TableCell>Civil Status</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Fonction</TableCell>
                <TableCell>Contract Type</TableCell>
                <TableCell>Seniority</TableCell>
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
                  <TableCell>{employee.seniority}</TableCell>
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
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="full_name"
              label="Full Name"
              value={formData.full_name}
              onChange={handleTextChange}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Civil Status</InputLabel>
              <Select
                name="civil_status"
                value={formData.civil_status}
                onChange={handleSelectChange}
                label="Civil Status"
              >
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="M">M</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="birth_date"
              label="Birth Date"
              type="date"
              value={formData.birth_date}
              onChange={handleTextChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="entry_date"
              label="Entry Date"
              type="date"
              value={formData.entry_date}
              onChange={handleTextChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="seniority"
              label="Seniority"
              value={calculateSeniority(formData.entry_date)}
              fullWidth
              disabled
            />
            <FormControl fullWidth required>
              <InputLabel>Contract Type</InputLabel>
              <Select
                name="contract_type"
                value={formData.contract_type}
                onChange={handleSelectChange}
                label="Contract Type"
              >
                {contractTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="job_title"
              label="Job Title"
              value={formData.job_title}
              onChange={handleTextChange}
              fullWidth
              required
            />
            <TextField
              name="fonction"
              label="Fonction"
              value={formData.fonction}
              onChange={handleTextChange}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Sub Type</InputLabel>
              <Select
                name="sub_type_id"
                value={formData.sub_type_id !== undefined ? String(formData.sub_type_id) : ''}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    sub_type_id: e.target.value === '' ? undefined : Number(e.target.value),
                  }));
                }}
                label="Sub Type"
              >
                <MenuItem value="1">UTEX</MenuItem>
                <MenuItem value="2">POLIVALONT</MenuItem>
                <MenuItem value="3">PULLMAN</MenuItem>
                <MenuItem value="4">SNEL</MenuItem>
                <MenuItem value="5">BCDC</MenuItem>
                <MenuItem value="6">AUCUN</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="type_description"
              label="Type Description"
              value={getTypeDescription(formData.sub_type_id)}
              fullWidth
              disabled
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingEmployee ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;