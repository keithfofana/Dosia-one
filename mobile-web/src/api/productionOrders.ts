import { apiClient } from './client';
import type { PaginatedResponse, ProductionCostSummary, ProductionOrder } from '../types/models';

export interface ProductionOrderInput {
  product_id: number;
  quantity_to_produce: number;
}

export async function listProductionOrders(): Promise<PaginatedResponse<ProductionOrder>> {
  const { data } = await apiClient.get<PaginatedResponse<ProductionOrder>>('/production-orders');
  return data;
}

export async function createProductionOrder(payload: ProductionOrderInput): Promise<ProductionOrder> {
  const { data } = await apiClient.post<ProductionOrder>('/production-orders', payload);
  return data;
}

export async function updateProductionOrderStatus(
  id: number,
  status: ProductionOrder['status'],
  extra?: { labor_cost?: number; overhead_cost?: number }
): Promise<ProductionOrder> {
  const { data } = await apiClient.put<ProductionOrder>(`/production-orders/${id}`, { status, ...extra });
  return data;
}

export async function getProductionOrderCost(id: number): Promise<ProductionCostSummary> {
  const { data } = await apiClient.get<ProductionCostSummary>(`/production-orders/${id}/cost`);
  return data;
}

export async function updateProductionOrderQuantity(id: number, quantityToProduce: number): Promise<ProductionOrder> {
  const { data } = await apiClient.put<ProductionOrder>(`/production-orders/${id}`, { quantity_to_produce: quantityToProduce });
  return data;
}

export async function deleteProductionOrder(id: number): Promise<void> {
  await apiClient.delete(`/production-orders/${id}`);
}
