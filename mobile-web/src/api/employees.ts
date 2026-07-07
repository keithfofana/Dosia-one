import { apiClient } from './client';
import type { Employee, PaginatedResponse } from '../types/models';

export interface EmployeeInput {
  user_id?: number | null;
  name: string;
  position?: string;
  hire_date?: string;
}

export async function listEmployees(): Promise<PaginatedResponse<Employee>> {
  const { data } = await apiClient.get<PaginatedResponse<Employee>>('/employees');
  return data;
}

export async function getEmployee(id: number): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/employees/${id}`);
  return data;
}

export async function createEmployee(payload: EmployeeInput): Promise<Employee> {
  const { data } = await apiClient.post<Employee>('/employees', payload);
  return data;
}
