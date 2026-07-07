import { apiClient } from './client';
import type { SessionInfo } from '../types/models';

export async function listSessions(): Promise<SessionInfo[]> {
  const { data } = await apiClient.get<SessionInfo[]>('/auth/sessions');
  return data;
}

export async function revokeSession(id: number): Promise<void> {
  await apiClient.delete(`/auth/sessions/${id}`);
}
