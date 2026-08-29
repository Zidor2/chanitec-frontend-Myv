import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import {
  employeeService,
  Employee,
  EmployeeIntervention,
  CreateEmployeeDTO
} from '../../services/employee-service';
import {
  EMPTY_EMPLOYEE_FORM,
  CIVIL_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS,
  calculateSeniority,
  toEmployeeFormData,
  buildEmployeePayload,
  subTypeFromDescription
} from '../../utils/employeeForm';
import './EmployeePage.scss';

interface EmployeePageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const displayObservation = (value?: string | null) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return '—';
  }
  return String(value);
};

const EmployeePage: React.FC<EmployeePageProps> = ({
  currentPath = '/org-chart',
  onNavigate,
  onLogout
}) => {
  const { id } = useParams<{ id: string }>();
  const employeeId = Number(id);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [interventions, setInterventions] = useState<EmployeeIntervention[]>([]);
  const [formData, setFormData] = useState<CreateEmployeeDTO>(EMPTY_EMPLOYEE_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadPage = async (targetId: number) => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const [employeeData, interventionData] = await Promise.all([
        employeeService.getEmployeeById(targetId),
        employeeService.getEmployeeInterventions(targetId)
      ]);
      setEmployee(employeeData);
      setFormData(toEmployeeFormData(employeeData));
      setInterventions(interventionData);
    } catch (err) {
      console.error('Error loading employee page', err);
      setError('Impossible de charger la fiche employé.');
      setEmployee(null);
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(employeeId)) {
      setError('Employé introuvable.');
      setLoading(false);
      return;
    }
    loadPage(employeeId);
  }, [employeeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = e.target.name as keyof CreateEmployeeDTO;
    const rawValue = e.target.value;
    setFormData((prev) => {
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

  const handleSubmit = async () => {
    if (!employee) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const updated = await employeeService.updateEmployee(employee.id, buildEmployeePayload(formData));
      setEmployee(updated);
      setFormData(toEmployeeFormData(updated));
      setStatus('Employé enregistré.');
    } catch (err) {
      console.error('Error saving employee', err);
      setError('Impossible d’enregistrer l’employé. Vérifiez les informations.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    const confirmed = window.confirm(`Supprimer ${employee.full_name} ? Cette action est irréversible.`);
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    try {
      await employeeService.deleteEmployee(employee.id);
      onNavigate?.('/org-chart');
    } catch (err) {
      console.error('Error deleting employee', err);
      setError('Impossible de supprimer l’employé.');
      setSaving(false);
    }
  };

  const hasScore = employee?.score !== null && employee?.score !== undefined;
  const scoreClass = hasScore
    ? Number(employee?.score) < 70
      ? 'score-low'
      : 'score-high'
    : '';

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="employee-page">
        <div className="employee-page-header">
          <button type="button" className="employee-back-button" onClick={() => onNavigate?.('/org-chart')}>
            Retour à l’organigramme
          </button>
          <div>
            <h1>{employee?.full_name || 'Fiche employé'}</h1>
            {employee && (
              <div className={`employee-score-badge ${scoreClass}`.trim()}>
                Score : {hasScore ? employee.score : '—'}
              </div>
            )}
          </div>
        </div>

        {loading && <div className="employee-page-message">Chargement de la fiche employé...</div>}
        {error && <div className="employee-page-error">{error}</div>}
        {status && <div className="employee-page-status">{status}</div>}

        {!loading && employee && (
          <>
            <section className="employee-card">
              <h2>Informations</h2>
              <fieldset className="employee-form" disabled={saving}>
                <div className="employee-form-grid">
                  <div className="employee-form-row">
                    <label>Nom complet</label>
                    <input name="full_name" value={formData.full_name} onChange={handleInputChange} />
                  </div>
                  <div className="employee-form-row">
                    <label>Statut civil</label>
                    <select name="civil_status" value={formData.civil_status} onChange={handleInputChange}>
                      <option value="">Sélectionner</option>
                      {CIVIL_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="employee-form-row">
                    <label>Date de naissance</label>
                    <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} />
                  </div>
                  <div className="employee-form-row">
                    <label>Date d'entrée</label>
                    <input type="date" name="entry_date" value={formData.entry_date} onChange={handleInputChange} />
                  </div>
                  <div className="employee-form-row">
                    <label>Ancienneté</label>
                    <input name="seniority" value={formData.seniority} onChange={handleInputChange} />
                  </div>
                  <div className="employee-form-row">
                    <label>Poste</label>
                    <input name="job_title" value={formData.job_title} onChange={handleInputChange} />
                  </div>
                  <div className="employee-form-row">
                    <label>Fonction</label>
                    <input name="fonction" value={formData.fonction} onChange={handleInputChange} />
                  </div>
                  <div className="employee-form-row">
                    <label>Type de contrat</label>
                    <select name="contract_type" value={formData.contract_type} onChange={handleInputChange}>
                      <option value="">Sélectionner</option>
                      {CONTRACT_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      {formData.contract_type && !CONTRACT_TYPE_OPTIONS.includes(formData.contract_type) && (
                        <option value={formData.contract_type}>{formData.contract_type}</option>
                      )}
                    </select>
                  </div>
                  <div className="employee-form-row">
                    <label>Sous-type ID</label>
                    <input
                      type="number"
                      name="sub_type_id"
                      value={formData.sub_type_id ?? ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="employee-form-row">
                    <label>Type de poste</label>
                    <select name="type_description" value={formData.type_description} onChange={handleInputChange}>
                      <option value="">Sélectionner</option>
                      {EMPLOYEE_TYPE_OPTIONS.map((type) => (
                        <option key={type.key} value={type.title}>
                          {type.title}
                        </option>
                      ))}
                      {formData.type_description &&
                        !EMPLOYEE_TYPE_OPTIONS.some((type) => type.title === formData.type_description) && (
                          <option value={formData.type_description}>{formData.type_description}</option>
                        )}
                    </select>
                  </div>
                </div>
              </fieldset>
              <div className="employee-form-actions">
                <button
                  type="button"
                  className="employee-button employee-button-danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className="employee-button employee-button-primary"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </section>

            <section className="employee-card">
              <h2>Interventions signées</h2>
              <p className="employee-interventions-hint">
                Le score est la moyenne des observations de ces interventions.
              </p>
              {interventions.length === 0 ? (
                <div className="employee-page-message">Aucune intervention signée pour cet employé.</div>
              ) : (
                <div className="employee-table-wrap">
                  <table className="employee-interventions-table">
                    <thead>
                      <tr>
                        <th>ID intervention</th>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Observation client</th>
                        <th>Observation Chanic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interventions.map((intervention) => (
                        <tr
                          key={intervention.intervention_id}
                          className="employee-intervention-row"
                          onClick={() => onNavigate?.(`/intervention/${intervention.intervention_id}`)}
                        >
                          <td>{intervention.intervention_id}</td>
                          <td>{formatDisplayDate(intervention.date)}</td>
                          <td>{intervention.client || '—'}</td>
                          <td>{displayObservation(intervention.observations_client)}</td>
                          <td>{displayObservation(intervention.observations_chanic)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};

export default EmployeePage;
