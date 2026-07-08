import { apiClient } from './client';
import type { PaginatedResponse, StockMovement, StockVariation } from '../types/models';

export interface StockMovementFilters {
  product_id?: number;
  date_from?: string;
  date_to?: string;
  per_page?: number;
}

export async function listStockMovements(filters: StockMovementFilters = {}): Promise<PaginatedResponse<StockMovement>> {
  const { data } = await apiClient.get<PaginatedResponse<StockMovement>>('/stock-movements', { params: filters });
  return data;
}

export async function createStockMovement(payload: {
  product_id: number;
  type: StockMovement['type'];
  quantity: number;
  reason?: string;
}): Promise<StockMovement> {
  const { data } = await apiClient.post<StockMovement>('/stock-movements', payload);
  return data;
}

export async function getStockVariation(
  productId: number,
  dateFrom?: string,
  dateTo?: string
): Promise<StockVariation> {
  const { data } = await apiClient.get<StockVariation>('/stock-movements/variation', {
    params: { product_id: productId, date_from: dateFrom, date_to: dateTo },
  });
  return data;
}
