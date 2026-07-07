import { apiClient } from './client';
import type { PaginatedResponse, RawMaterialMovement } from '../types/models';

export interface RawMaterialMovementInput {
  raw_material_id: number;
  type: RawMaterialMovement['type'];
  quantity: number;
  reason?: string;
}

export async function listRawMaterialMovements(): Promise<PaginatedResponse<RawMaterialMovement>> {
  const { data } = await apiClient.get<PaginatedResponse<RawMaterialMovement>>('/raw-material-movements');
  return data;
}

export async function createRawMaterialMovement(payload: RawMaterialMovementInput): Promise<RawMaterialMovement> {
  const { data } = await apiClient.post<RawMaterialMovement>('/raw-material-movements', payload);
  return data;
}
