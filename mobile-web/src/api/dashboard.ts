import { apiClient } from './client';
import type { DashboardAlerts, DashboardSummary } from '../types/models';

export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return data;
}

export async function getAlerts(): Promise<DashboardAlerts> {
  const { data } = await apiClient.get<DashboardAlerts>('/dashboard/alerts');
  return data;
}
