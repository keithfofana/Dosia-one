import { apiClient } from './client';
import type { BankAccount, CashRegister, PaginatedResponse, TreasuryForecast } from '../types/models';

export async function listBankAccounts(): Promise<PaginatedResponse<BankAccount>> {
  const { data } = await apiClient.get<PaginatedResponse<BankAccount>>('/bank-accounts');
  return data;
}

export async function createBankAccount(payload: Partial<BankAccount>): Promise<BankAccount> {
  const { data } = await apiClient.post<BankAccount>('/bank-accounts', payload);
  return data;
}

export async function updateBankAccount(id: number, payload: Partial<BankAccount>): Promise<BankAccount> {
  const { data } = await apiClient.put<BankAccount>(`/bank-accounts/${id}`, payload);
  return data;
}

export async function deleteBankAccount(id: number): Promise<void> {
  await apiClient.delete(`/bank-accounts/${id}`);
}

export async function listCashRegisters(): Promise<PaginatedResponse<CashRegister>> {
  const { data } = await apiClient.get<PaginatedResponse<CashRegister>>('/cash-registers');
  return data;
}

export async function createCashRegister(payload: Partial<CashRegister>): Promise<CashRegister> {
  const { data } = await apiClient.post<CashRegister>('/cash-registers', payload);
  return data;
}

export async function updateCashRegister(id: number, payload: Partial<CashRegister>): Promise<CashRegister> {
  const { data } = await apiClient.put<CashRegister>(`/cash-registers/${id}`, payload);
  return data;
}

export async function deleteCashRegister(id: number): Promise<void> {
  await apiClient.delete(`/cash-registers/${id}`);
}

export async function depositToCashRegister(id: number, amount: number, reason?: string): Promise<CashRegister> {
  const { data } = await apiClient.post<CashRegister>(`/cash-registers/${id}/deposit`, { amount, reason });
  return data;
}

export async function withdrawFromCashRegister(id: number, amount: number, reason?: string): Promise<CashRegister> {
  const { data } = await apiClient.post<CashRegister>(`/cash-registers/${id}/withdraw`, { amount, reason });
  return data;
}

export async function getTreasuryForecast(): Promise<TreasuryForecast> {
  const { data } = await apiClient.get<TreasuryForecast>('/treasury/forecast');
  return data;
}
