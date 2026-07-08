import { apiClient } from './client';
import type { PaginatedResponse, RawMaterial } from '../types/models';

export interface RawMaterialInput {
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
}

export async function listRawMaterials(): Promise<PaginatedResponse<RawMaterial>> {
  const { data } = await apiClient.get<PaginatedResponse<RawMaterial>>('/raw-materials');
  return data;
}

export async function createRawMaterial(payload: RawMaterialInput): Promise<RawMaterial> {
  const { data } = await apiClient.post<RawMaterial>('/raw-materials', payload);
  return data;
}

export async function updateRawMaterial(id: number, payload: RawMaterialInput): Promise<RawMaterial> {
  const { data } = await apiClient.put<RawMaterial>(`/raw-materials/${id}`, payload);
  return data;
}

export async function deleteRawMaterial(id: number): Promise<void> {
  await apiClient.delete(`/raw-materials/${id}`);
}
