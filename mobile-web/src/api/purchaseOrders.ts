import { apiClient } from './client';
import type { PaginatedResponse, PurchaseOrder } from '../types/models';

export interface PurchaseOrderItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface ReceiveItemInput {
  product_id: number;
  quantity_received: number;
}

export async function listPurchaseOrders(): Promise<PaginatedResponse<PurchaseOrder>> {
  const { data } = await apiClient.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders');
  return data;
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const { data } = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
  return data;
}

export async function createPurchaseOrder(supplierId: number, items: PurchaseOrderItemInput[]): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>('/purchase-orders', { supplier_id: supplierId, items });
  return data;
}

export async function receivePurchaseOrder(id: number, items: ReceiveItemInput[]): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/receive`, { items });
  return data;
}

export async function updatePurchaseOrder(id: number, supplierId: number, items: PurchaseOrderItemInput[]): Promise<PurchaseOrder> {
  const { data } = await apiClient.put<PurchaseOrder>(`/purchase-orders/${id}`, { supplier_id: supplierId, items });
  return data;
}

export async function cancelPurchaseOrder(id: number): Promise<PurchaseOrder> {
  const { data } = await apiClient.put<PurchaseOrder>(`/purchase-orders/${id}`, { status: 'annulee' });
  return data;
}

export async function deletePurchaseOrder(id: number): Promise<void> {
  await apiClient.delete(`/purchase-orders/${id}`);
}
