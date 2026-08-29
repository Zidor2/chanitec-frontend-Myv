export interface Employee {
  id: number;
  full_name: string;
  civil_status: string;
  birth_date: string;
  entry_date: string;
  seniority: string;
  contract_type: string;
  job_title: string;
  fonction: string;
  sub_type_id?: number;
  type_description?: string;
  score?: number | null;
}

export interface EmployeeIntervention {
  intervention_id: number;
  date: string | null;
  client: string;
  observations_client: string;
  observations_chanic: string;
}

export interface CreateEmployeeDTO {
  full_name: string;
  civil_status: string;
  birth_date: string;
  entry_date: string;
  seniority: string;
  contract_type: string;
  job_title: string;
  fonction: string;
  sub_type_id?: number;
  type_description?: string;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {}

const parseResponse = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

class EmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees`);
    return parseResponse(response);
  }

  async getEmployeeById(id: number): Promise<Employee> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees/${id}`);
    return parseResponse(response);
  }

  async getEmployeeInterventions(id: number): Promise<EmployeeIntervention[]> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees/${id}/interventions`);
    return parseResponse(response);
  }

  async createEmployee(employeeData: CreateEmployeeDTO): Promise<Employee> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    return parseResponse(response);
  }

  async updateEmployee(id: number, employeeData: UpdateEmployeeDTO): Promise<Employee> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });
    return parseResponse(response);
  }

  async deleteEmployee(id: number): Promise<void> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    await parseResponse(response);
  }
}

export const employeeService = new EmployeeService();
