import { apiClient } from './client';
import type { PaginatedResponse, Supplier } from '../types/models';

export async function listSuppliers(): Promise<PaginatedResponse<Supplier>> {
  const { data } = await apiClient.get<PaginatedResponse<Supplier>>('/suppliers');
  return data;
}

export async function createSupplier(payload: Partial<Supplier>): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>('/suppliers', payload);
  return data;
}
