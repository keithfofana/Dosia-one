import { apiClient } from './client';
import type { Client, ClientHistoryEntry, PaginatedResponse } from '../types/models';

export async function listClients(): Promise<PaginatedResponse<Client>> {
  const { data } = await apiClient.get<PaginatedResponse<Client>>('/clients');
  return data;
}

export async function getClient(id: number): Promise<Client & { client_interactions: unknown[]; quotes: unknown[]; invoices: unknown[] }> {
  const { data } = await apiClient.get(`/clients/${id}`);
  return data;
}

export async function createClient(payload: Partial<Client>): Promise<Client> {
  const { data } = await apiClient.post<Client>('/clients', payload);
  return data;
}

export async function getClientHistory(id: number): Promise<ClientHistoryEntry[]> {
  const { data } = await apiClient.get<ClientHistoryEntry[]>(`/clients/${id}/history`);
  return data;
}

export async function updateClient(id: number, payload: Partial<Client>): Promise<Client> {
  const { data } = await apiClient.put<Client>(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: number): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
