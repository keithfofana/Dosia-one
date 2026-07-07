import { apiClient } from './client';
import type { Invoice, PaginatedResponse } from '../types/models';
import type { QuoteItemInput } from './quotes';

export async function listInvoices(): Promise<PaginatedResponse<Invoice>> {
  const { data } = await apiClient.get<PaginatedResponse<Invoice>>('/invoices');
  return data;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
  return data;
}

export async function createInvoice(
  clientId: number,
  items: QuoteItemInput[],
  quoteId?: number
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>('/invoices', {
    client_id: clientId,
    items,
    quote_id: quoteId,
  });
  return data;
}

export async function recordPayment(invoiceId: number, amount: number, method: string) {
  const { data } = await apiClient.post('/payments', { invoice_id: invoiceId, amount, method });
  return data;
}
