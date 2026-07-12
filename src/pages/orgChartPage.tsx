import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { employeeService, Employee as BackendEmployee, CreateEmployeeDTO } from '../services/employee-service';
import './orgChartPage.scss';

// Function to generate dummy profile picture using initials
const generateDummyAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];

  const svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="${backgroundColor}"/>
      <text x="32" y="40" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

interface OrgEmployee {
  id: number;
  name: string;
  title: string;
  location: string;
  avatar: string;
  subType?: string;
  typeDescription?: string;
}

interface OrgChartPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const OrgChartPage: React.FC<OrgChartPageProps> = ({
  currentPath = '/org-chart',
  onNavigate,
  onLogout
}) => {
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
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

  const civilStatusOptions = [
    { value: 'C', label: 'Célibataire' },
    { value: 'M', label: 'Marié' },
  ];
  const contractTypeOptions = ['CDI', 'CDD', 'Interim'];

  const resetForm = () => {
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
    setDialogError(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsDialogOpen(false);
    setDialogError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = e.target.name as keyof CreateEmployeeDTO;
    const value = field === 'sub_type_id' ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const mapToOrgEmployee = (emp: BackendEmployee): OrgEmployee => ({
    id: emp.id,
    name: emp.full_name,
    title: emp.job_title || emp.fonction || 'Collaborateur',
    location: emp.fonction || emp.contract_type || '',
    subType: emp.type_description || undefined,
    typeDescription: emp.type_description || undefined,
    avatar: generateDummyAvatar(emp.full_name)
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setDialogError(null);
    try {
      await employeeService.createEmployee(formData);
      const data = await employeeService.getAllEmployees();
      setEmployees(data.map(mapToOrgEmployee));
      closeCreateDialog();
    } catch (err) {
      console.error('Error creating employee', err);
      setDialogError('Impossible d’ajouter l’employé. Vérifiez les informations.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    employeeService.getAllEmployees()
      .then((data: BackendEmployee[]) => {
        const orgEmployees = data.map(emp => ({
          id: emp.id,
          name: emp.full_name,
          title: emp.job_title || emp.fonction || 'Collaborateur',
          location: emp.fonction || emp.contract_type || '',
          subType: emp.type_description || undefined,
          typeDescription: emp.type_description || undefined,
          avatar: generateDummyAvatar(emp.full_name)
        }));
        setEmployees(orgEmployees);
      })
      .catch(err => {
        console.error('Unable to load employees for org chart', err);
        setError('Impossible de charger les employés depuis la base de données.');
      })
      .finally(() => setLoading(false));
  }, []);

  const leader = employees.find(emp =>
    emp.title.toLowerCase().includes('departement froid') ||
    emp.title.toLowerCase().includes('departement') ||
    emp.title.toLowerCase().includes('direction') ||
    emp.typeDescription?.toLowerCase().includes('direction')
  ) || employees[0];

  const isClimDomestique = (emp: OrgEmployee) =>
    emp.title.toLowerCase().includes('chef de service chargé de clim-domestique') ||
    (emp.typeDescription?.toLowerCase().includes('utex') || false) ||
    (emp.typeDescription?.toLowerCase().includes('snel') || false);

  const isPolyvalent = (emp: OrgEmployee) =>
    emp.title.toLowerCase().includes('polyvalent') ||
    (emp.typeDescription?.toLowerCase().includes('polyvalent') || false);

  const isClimatisationCentralise = (emp: OrgEmployee) =>
    emp.title.toLowerCase().includes('chef de service adj chargé du climatisation centralisé') ||
    emp.title.toLowerCase().includes('climatisation centralisé') ||
    (emp.typeDescription?.toLowerCase().includes('climatisation centralisé') || false);

  const climDomestiqueEmployees = employees.filter(emp => emp.id !== leader?.id && isClimDomestique(emp));
  const polyvalentEmployees = employees.filter(emp => emp.id !== leader?.id && isPolyvalent(emp));
  const climatisationCentraliseEmployees = employees.filter(emp => emp.id !== leader?.id && isClimatisationCentralise(emp));
  const otherEmployees = employees.filter(emp =>
    emp.id !== leader?.id &&
    !isClimDomestique(emp) &&
    !isPolyvalent(emp) &&
    !isClimatisationCentralise(emp)
  );

  const renderEmployeeRows = (employeeList: OrgEmployee[]) => {
    const rows = [];
    for (let i = 0; i < employeeList.length; i += 2) {
      const row = employeeList.slice(i, i + 2);
      rows.push(
        <div className="orgchart-row" key={i}>
          {row.map(employee => (
            <div className="orgchart-card advisor" key={employee.id}>
              <img src={employee.avatar} alt={employee.name} className="orgchart-avatar" />
              <div className="orgchart-name">{employee.name}</div>
              <div className="orgchart-title">{employee.subType || employee.title}</div>
              <div className="orgchart-location">{employee.location}</div>
            </div>
          ))}
        </div>
      );
    }
    return rows;
  };

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="orgchart-container">
        <div className="orgchart-actions">
          <button
            type="button"
            className="orgchart-add-button"
            onClick={openCreateDialog}
          >
            Ajouter un employé
          </button>
        </div>

        {isDialogOpen && (
          <div className="orgchart-overlay">
            <div className="orgchart-dialog">
              <h2>Ajouter un nouvel employé</h2>
              <div className="orgchart-form-row">
                <label>Nom complet</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-row">
                <label>Statut civil</label>
                <select
                  name="civil_status"
                  value={formData.civil_status}
                  onChange={handleInputChange}
                >
                  <option value="">Sélectionner</option>
                  {civilStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="orgchart-form-row">
                <label>Date de naissance</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-row">
                <label>Date d'entrée</label>
                <input
                  type="date"
                  name="entry_date"
                  value={formData.entry_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-row">
                <label>Ancienneté</label>
                <input
                  name="seniority"
                  value={formData.seniority}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-row">
                <label>Poste</label>
                <input
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-row">
                <label>Fonction</label>
                <input
                  name="fonction"
                  value={formData.fonction}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-row">
                <label>Type de contrat</label>
                <select
                  name="contract_type"
                  value={formData.contract_type}
                  onChange={handleInputChange}
                >
                  <option value="">Sélectionner</option>
                  {contractTypeOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="orgchart-form-row">
                <label>Sous-type ID</label>
                <input
                  type="number"
                  name="sub_type_id"
                  value={formData.sub_type_id ?? ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-row">
                <label>Type de poste</label>
                <input
                  name="type_description"
                  value={formData.type_description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="orgchart-form-actions">
                <button type="button" className="orgchart-dialog-button" onClick={closeCreateDialog}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="orgchart-dialog-button orgchart-dialog-button-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
              {dialogError && <div className="orgchart-dialog-error">{dialogError}</div>}
            </div>
          </div>
        )}

        {loading && <div className="orgchart-loading">Chargement des employés...</div>}
        {error && <div className="orgchart-error">{error}</div>}

        {!loading && !error && leader && (
          <>
            <div className="orgchart-leader">
              <div className="orgchart-card leader">
                <img src={leader.avatar} alt={leader.name} className="orgchart-avatar leader" />
                <div className="orgchart-name leader">{leader.name}</div>
                <div className="orgchart-title leader">{leader.title}</div>
                <div className="orgchart-location leader">{leader.location}</div>
              </div>
            </div>
            <div className="orgchart-line" />

            <div className="orgchart-sections">
              <div className="orgchart-section">
                <h2 className="orgchart-section-title">Chef de service Chargé de clim-domestique</h2>
                <div className="orgchart-advisors">
                  {renderEmployeeRows(climDomestiqueEmployees)}
                </div>
              </div>

              <div className="orgchart-section">
                <h2 className="orgchart-section-title">Polyvalent</h2>
                <div className="orgchart-advisors">
                  {renderEmployeeRows(polyvalentEmployees)}
                </div>
              </div>

              <div className="orgchart-section">
                <h2 className="orgchart-section-title">Chef de service adj chargé du climatisation centralisé</h2>
                <div className="orgchart-advisors">
                  {renderEmployeeRows(climatisationCentraliseEmployees)}
                </div>
              </div>

              {otherEmployees.length > 0 && (
                <div className="orgchart-section">
                  <h2 className="orgchart-section-title">Autres collaborateurs</h2>
                  <div className="orgchart-advisors">
                    {renderEmployeeRows(otherEmployees)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};


export default OrgChartPage;