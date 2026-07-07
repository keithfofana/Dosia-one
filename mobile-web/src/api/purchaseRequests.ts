import { apiClient } from './client';
import type { PaginatedResponse, PurchaseRequest } from '../types/models';

export async function listPurchaseRequests(): Promise<PaginatedResponse<PurchaseRequest>> {
  const { data } = await apiClient.get<PaginatedResponse<PurchaseRequest>>('/purchase-requests');
  return data;
}

export async function createPurchaseRequest(productId: number, quantity: number): Promise<PurchaseRequest> {
  const { data } = await apiClient.post<PurchaseRequest>('/purchase-requests', { product_id: productId, quantity });
  return data;
}

export async function updatePurchaseRequestStatus(id: number, status: PurchaseRequest['status']): Promise<PurchaseRequest> {
  const { data } = await apiClient.put<PurchaseRequest>(`/purchase-requests/${id}`, { status });
  return data;
}
