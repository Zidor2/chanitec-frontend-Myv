import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { employeeService, Employee as BackendEmployee, CreateEmployeeDTO } from '../services/employee-service';
import {
  EMPTY_EMPLOYEE_FORM,
  CIVIL_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS,
  calculateSeniority,
  buildEmployeePayload,
  subTypeFromDescription
} from '../utils/employeeForm';
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
  score?: number | null;
}

const ORG_CHART_TYPES = [
  {
    key: 'clim-domestique',
    title: 'Chef de service Chargé de clim-domestique',
    matches: (description: string) =>
      description.includes('clim-domestique') || description.includes('clim domestique')
  },
  {
    key: 'polyvalent',
    title: 'Polyvalent',
    matches: (description: string) => description.includes('polyvalent')
  },
  {
    key: 'climatisation-centralise',
    title: 'Chef de service adj chargé du climatisation centralisé',
    matches: (description: string) => description.includes('climatisation centralis')
  }
] as const;

const DEPARTMENT_LEADER: OrgEmployee = {
  id: 0,
  name: 'Département Froid et climatisation',
  title: 'Direction',
  location: '',
  avatar: generateDummyAvatar('Departement Froid')
};

const normalizeTypeDescription = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getOrgTypeKey = (typeDescription?: string) => {
  const description = normalizeTypeDescription(typeDescription);
  if (!description) {
    return null;
  }
  return ORG_CHART_TYPES.find(type => type.matches(description))?.key ?? null;
};

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
  const [formData, setFormData] = useState<CreateEmployeeDTO>(EMPTY_EMPLOYEE_FORM);

  const reloadEmployees = async () => {
    const data = await employeeService.getAllEmployees();
    setEmployees(data.map(mapToOrgEmployee));
  };

  const resetForm = () => {
    setFormData(EMPTY_EMPLOYEE_FORM);
    setDialogError(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openEmployeePage = (employeeId: number) => {
    onNavigate?.(`/employees/${employeeId}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = e.target.name as keyof CreateEmployeeDTO;
    const rawValue = e.target.value;
    setFormData(prev => {
      const next = {
        ...prev,
        [field]: field === 'sub_type_id' ? (rawValue ? Number(rawValue) : undefined) : rawValue
      };
      if (field === 'entry_date') {
        next.seniority = calculateSeniority(rawValue);
      }
      if (field === 'type_description') {
        next.sub_type_id = subTypeFromDescription(rawValue) ?? prev.sub_type_id;
      }
      return next;
    });
  };

  const mapToOrgEmployee = (emp: BackendEmployee): OrgEmployee => ({
    id: emp.id,
    name: emp.full_name,
    title: emp.job_title || emp.fonction || 'Collaborateur',
    location: emp.fonction || emp.contract_type || '',
    subType: emp.type_description || undefined,
    typeDescription: emp.type_description || undefined,
    avatar: generateDummyAvatar(emp.full_name),
    score: emp.score ?? null
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setDialogError(null);
    try {
      await employeeService.createEmployee(buildEmployeePayload(formData));
      await reloadEmployees();
      closeDialog();
    } catch (err) {
      console.error('Error saving employee', err);
      setDialogError('Impossible d’ajouter l’employé. Vérifiez les informations.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    employeeService.getAllEmployees()
      .then((data: BackendEmployee[]) => {
        setEmployees(data.map(mapToOrgEmployee));
      })
      .catch(err => {
        console.error('Unable to load employees for org chart', err);
        setError('Impossible de charger les employés depuis la base de données.');
      })
      .finally(() => setLoading(false));
  }, []);

  const leader = employees.find(emp => {
    const description = normalizeTypeDescription(emp.typeDescription);
    const title = normalizeTypeDescription(emp.title);
    return (
      description.includes('direction') ||
      title.includes('departement froid') ||
      title.includes('direction')
    ) && !getOrgTypeKey(emp.typeDescription);
  }) || DEPARTMENT_LEADER;

  const employeesByType = ORG_CHART_TYPES.map(type => ({
    key: type.key,
    title: type.title,
    employees: employees.filter(emp => getOrgTypeKey(emp.typeDescription) === type.key)
  }));

  const renderEmployeeRows = (employeeList: OrgEmployee[]) => {
    const rows = [];
    for (let i = 0; i < employeeList.length; i += 2) {
      const row = employeeList.slice(i, i + 2);
      rows.push(
        <div className="orgchart-row" key={i}>
          {row.map(employee => {
            const hasScore = employee.score !== null && employee.score !== undefined;
            const scoreClass = hasScore
              ? (Number(employee.score) < 70 ? 'score-low' : 'score-high')
              : '';
            return (
            <div
              className={`orgchart-card advisor is-clickable ${scoreClass}`.trim()}
              key={employee.id}
              role="button"
              tabIndex={0}
              onClick={() => openEmployeePage(employee.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openEmployeePage(employee.id);
                }
              }}
            >
              <img src={employee.avatar} alt={employee.name} className="orgchart-avatar" />
              <div className="orgchart-name">{employee.name}</div>
              <div className="orgchart-title">{employee.title}</div>
              {employee.location ? <div className="orgchart-location">{employee.location}</div> : null}
              <div className="orgchart-score">
                Score : {hasScore ? employee.score : '—'}
              </div>
            </div>
            );
          })}
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
          <div className="orgchart-overlay" onClick={closeDialog}>
            <div className="orgchart-dialog" onClick={(event) => event.stopPropagation()}>
              <h2>Ajouter un nouvel employé</h2>
              <fieldset className="orgchart-form" disabled={isSubmitting}>
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
                  {CIVIL_STATUS_OPTIONS.map(option => (
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
                  {CONTRACT_TYPE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {formData.contract_type &&
                    !CONTRACT_TYPE_OPTIONS.includes(formData.contract_type) && (
                      <option value={formData.contract_type}>{formData.contract_type}</option>
                    )}
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
                <select
                  name="type_description"
                  value={formData.type_description}
                  onChange={handleInputChange}
                >
                  <option value="">Sélectionner</option>
                  {EMPLOYEE_TYPE_OPTIONS.map(type => (
                    <option key={type.key} value={type.title}>
                      {type.title}
                    </option>
                  ))}
                  {formData.type_description &&
                    !EMPLOYEE_TYPE_OPTIONS.some(type => type.title === formData.type_description) && (
                      <option value={formData.type_description}>{formData.type_description}</option>
                    )}
                </select>
              </div>
              </fieldset>
              <div className="orgchart-form-actions">
                <button type="button" className="orgchart-dialog-button" onClick={closeDialog}>
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

        {!loading && !error && (
          <>
            <div className="orgchart-leader">
              <div
                className={`orgchart-card leader ${leader.id ? 'is-clickable' : ''}`.trim()}
                role={leader.id ? 'button' : undefined}
                tabIndex={leader.id ? 0 : undefined}
                onClick={() => {
                  if (leader.id) openEmployeePage(leader.id);
                }}
                onKeyDown={(event) => {
                  if (!leader.id) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openEmployeePage(leader.id);
                  }
                }}
              >
                <img src={leader.avatar} alt={leader.name} className="orgchart-avatar leader" />
                <div className="orgchart-name leader">{leader.name}</div>
                <div className="orgchart-title leader">{leader.title}</div>
                {leader.location ? <div className="orgchart-location leader">{leader.location}</div> : null}
              </div>
            </div>
            <div className="orgchart-line" />

            <div className="orgchart-sections">
              {employeesByType.map(section => (
                <div className="orgchart-section" key={section.key}>
                  <h2 className="orgchart-section-title">{section.title}</h2>
                  <div className="orgchart-advisors">
                    {renderEmployeeRows(section.employees)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};


export default OrgChartPage;