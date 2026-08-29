import { CreateEmployeeDTO, Employee } from '../services/employee-service';

export const EMPTY_EMPLOYEE_FORM: CreateEmployeeDTO = {
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
};

export const CIVIL_STATUS_OPTIONS = [
  { value: 'C', label: 'Célibataire' },
  { value: 'M', label: 'Marié' }
];

export const CONTRACT_TYPE_OPTIONS = ['CDI', 'CDD', 'Interim', 'Consultance'];

export const EMPLOYEE_TYPE_OPTIONS = [
  {
    key: 'clim-domestique',
    title: 'Chef de service Chargé de clim-domestique'
  },
  {
    key: 'polyvalent',
    title: 'Polyvalent'
  },
  {
    key: 'climatisation-centralise',
    title: 'Chef de service adj chargé du climatisation centralisé'
  }
] as const;

export const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};

export const calculateSeniority = (entryDate: string) => {
  const startText = toDateInputValue(entryDate);
  if (!startText) {
    return '';
  }
  const start = new Date(`${startText}T00:00:00`);
  const end = new Date();
  if (Number.isNaN(start.getTime())) {
    return '';
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');
  return `${pad(years)} ans ${pad(months)} mois ${pad(days)} jours`;
};

const normalizeTypeDescription = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const subTypeFromDescription = (description?: string) => {
  const value = normalizeTypeDescription(description);
  if (value.includes('clim-domestique') || value.includes('clim domestique')) return 1;
  if (value.includes('polyvalent')) return 2;
  if (value.includes('climatisation centralis')) return 3;
  return undefined;
};

export const toEmployeeFormData = (emp: Employee): CreateEmployeeDTO => ({
  full_name: emp.full_name || '',
  civil_status: emp.civil_status || '',
  birth_date: toDateInputValue(emp.birth_date),
  entry_date: toDateInputValue(emp.entry_date),
  seniority: emp.seniority || calculateSeniority(emp.entry_date),
  contract_type: emp.contract_type || '',
  job_title: emp.job_title || '',
  fonction: emp.fonction || '',
  sub_type_id: emp.sub_type_id,
  type_description: emp.type_description || ''
});

export const buildEmployeePayload = (formData: CreateEmployeeDTO): CreateEmployeeDTO => ({
  ...formData,
  birth_date: toDateInputValue(formData.birth_date),
  entry_date: toDateInputValue(formData.entry_date),
  seniority: formData.seniority || calculateSeniority(formData.entry_date) || '-',
  fonction: formData.fonction || formData.job_title || '-',
  sub_type_id: formData.sub_type_id ?? subTypeFromDescription(formData.type_description),
  type_description: formData.type_description || ''
});
