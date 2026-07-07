import { apiClient } from './client';
import type { BillOfMaterialLine } from '../types/models';

export interface BillOfMaterialItemInput {
  raw_material_id: number;
  quantity_per_unit: number;
}

export async function getBillOfMaterial(productId: number): Promise<BillOfMaterialLine[]> {
  const { data } = await apiClient.get<BillOfMaterialLine[]>(`/products/${productId}/bom`);
  return data;
}

export async function updateBillOfMaterial(productId: number, items: BillOfMaterialItemInput[]): Promise<BillOfMaterialLine[]> {
  const { data } = await apiClient.put<BillOfMaterialLine[]>(`/products/${productId}/bom`, { items });
  return data;
}
