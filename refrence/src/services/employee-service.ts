import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/employees`;

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

class EmployeeService {
  async getAllEmployees(): Promise<Employee[]> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees`).then(res => res.json());
    return response;
  }

  async getEmployeeById(id: number): Promise<Employee> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees/${id}`).then(res => res.json());
    return response;
  }

  async createEmployee(employeeData: CreateEmployeeDTO): Promise<Employee> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    }).then(res => res.json());
    return response;
  }

  async updateEmployee(id: number, employeeData: UpdateEmployeeDTO): Promise<Employee> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    }).then(res => res.json());
    return response;
  }

  async deleteEmployee(id: number): Promise<void> {
    await fetch(`${process.env.REACT_APP_API_URL}/employees/${id}`, {
      method: 'DELETE',
    });
  }
}

export const employeeService = new EmployeeService();