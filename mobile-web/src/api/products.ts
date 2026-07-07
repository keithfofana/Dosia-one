import { apiClient } from './client';
import type { PaginatedResponse, Product } from '../types/models';

export async function listProducts(): Promise<PaginatedResponse<Product>> {
  const { data } = await apiClient.get<PaginatedResponse<Product>>('/products');
  return data;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', payload);
  return data;
}
