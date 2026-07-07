import { apiClient } from './client';
import type { Contract, PaginatedResponse } from '../types/models';

export interface ContractInput {
  employee_id: number;
  type: string;
  start_date: string;
  end_date?: string | null;
}

export async function listContracts(): Promise<PaginatedResponse<Contract>> {
  const { data } = await apiClient.get<PaginatedResponse<Contract>>('/contracts');
  return data;
}

export async function createContract(payload: ContractInput): Promise<Contract> {
  const { data } = await apiClient.post<Contract>('/contracts', payload);
  return data;
}
