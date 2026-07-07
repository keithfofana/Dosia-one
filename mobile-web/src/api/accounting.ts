import { apiClient } from './client';
import type {
  BalanceSheet,
  ChartOfAccount,
  IncomeStatement,
  JournalEntry,
  LedgerMovement,
  PaginatedResponse,
  TrialBalanceRow,
  VatReport,
} from '../types/models';

export interface JournalEntryLineInput {
  account_id: number;
  debit: number;
  credit: number;
}

export async function listChartOfAccounts(): Promise<PaginatedResponse<ChartOfAccount>> {
  const { data } = await apiClient.get<PaginatedResponse<ChartOfAccount>>('/chart-of-accounts', { params: { per_page: 100 } });
  return data;
}

export async function createChartOfAccount(payload: Partial<ChartOfAccount>): Promise<ChartOfAccount> {
  const { data } = await apiClient.post<ChartOfAccount>('/chart-of-accounts', payload);
  return data;
}

export async function listJournalEntries(): Promise<PaginatedResponse<JournalEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<JournalEntry>>('/journal-entries');
  return data;
}

export async function createJournalEntry(
  entryDate: string,
  reference: string | undefined,
  description: string | undefined,
  lines: JournalEntryLineInput[]
): Promise<JournalEntry> {
  const { data } = await apiClient.post<JournalEntry>('/journal-entries', {
    entry_date: entryDate,
    reference,
    description,
    lines,
  });
  return data;
}

export async function getLedger(filters: { account_id?: number; from?: string; to?: string } = {}): Promise<LedgerMovement[]> {
  const { data } = await apiClient.get<LedgerMovement[]>('/accounting/ledger', { params: filters });
  return data;
}

export async function getBalance(): Promise<TrialBalanceRow[]> {
  const { data } = await apiClient.get<TrialBalanceRow[]>('/accounting/balance');
  return data;
}

export async function getBalanceSheet(): Promise<BalanceSheet> {
  const { data } = await apiClient.get<BalanceSheet>('/accounting/balance-sheet');
  return data;
}

export async function getIncomeStatement(): Promise<IncomeStatement> {
  const { data } = await apiClient.get<IncomeStatement>('/accounting/income-statement');
  return data;
}

export async function getVat(): Promise<VatReport> {
  const { data } = await apiClient.get<VatReport>('/accounting/vat');
  return data;
}

export async function exportReport(format: 'excel' | 'pdf'): Promise<Blob> {
  const { data } = await apiClient.get(`/accounting/export/${format}`, { responseType: 'blob' });
  return data;
}
