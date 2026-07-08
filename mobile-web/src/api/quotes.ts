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

export async function getQuote(id: number): Promise<Quote> {
  const { data } = await apiClient.get<Quote>(`/quotes/${id}`);
  return data;
}

export async function createQuote(clientId: number, items: QuoteItemInput[]): Promise<Quote> {
  const { data } = await apiClient.post<Quote>('/quotes', { client_id: clientId, items });
  return data;
}

export async function updateQuote(id: number, clientId: number, items: QuoteItemInput[]): Promise<Quote> {
  const { data } = await apiClient.put<Quote>(`/quotes/${id}`, { client_id: clientId, items });
  return data;
}

export async function deleteQuote(id: number): Promise<void> {
  await apiClient.delete(`/quotes/${id}`);
}
