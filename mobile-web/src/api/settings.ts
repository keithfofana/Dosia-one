import { apiClient } from './client';
import type { ActivityLogEntry, PaginatedResponse } from '../types/models';

export interface ActivityLogFilters {
  user_id?: number;
  module?: string;
}

export async function listActivityLog(filters: ActivityLogFilters = {}): Promise<PaginatedResponse<ActivityLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<ActivityLogEntry>>('/settings/activity-log', {
    params: filters,
  });
  return data;
}

export async function triggerBackup(): Promise<Blob> {
  const { data } = await apiClient.post('/settings/backup', null, { responseType: 'blob' });
  return data;
}
