import { apiClient } from './client';
import type { PaginatedResponse, Quote } from '../types/models';

export interface QuoteItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export async function listQuotes(): Promise<PaginatedResponse<Quote>> {
  const { data } = await apiClient.get<PaginatedResponse<Quote>>('/quotes');
  return data;
}

export async function createQuote(clientId: number, items: QuoteItemInput[]): Promise<Quote> {
  const { data } = await apiClient.post<Quote>('/quotes', { client_id: clientId, items });
  return data;
}
