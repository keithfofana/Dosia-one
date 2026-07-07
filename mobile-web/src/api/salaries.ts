import { apiClient } from './client';
import type { PaginatedResponse, Salary } from '../types/models';

export interface SalaryInput {
  employee_id: number;
  amount: number;
  period_month: string;
}

export async function listSalaries(): Promise<PaginatedResponse<Salary>> {
  const { data } = await apiClient.get<PaginatedResponse<Salary>>('/salaries');
  return data;
}

export async function createSalary(payload: SalaryInput): Promise<Salary> {
  const { data } = await apiClient.post<Salary>('/salaries', payload);
  return data;
}

export async function markSalaryPaid(id: number): Promise<Salary> {
  const { data } = await apiClient.put<Salary>(`/salaries/${id}`, { status: 'paye' });
  return data;
}
