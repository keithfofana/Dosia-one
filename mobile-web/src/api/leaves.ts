import { apiClient } from './client';
import type { Leave, PaginatedResponse } from '../types/models';

export interface LeaveInput {
  employee_id: number;
  start_date: string;
  end_date: string;
}

export async function listLeaves(): Promise<PaginatedResponse<Leave>> {
  const { data } = await apiClient.get<PaginatedResponse<Leave>>('/leaves');
  return data;
}

export async function createLeave(payload: LeaveInput): Promise<Leave> {
  const { data } = await apiClient.post<Leave>('/leaves', payload);
  return data;
}

export async function updateLeaveStatus(id: number, status: Leave['status']): Promise<Leave> {
  const { data } = await apiClient.put<Leave>(`/leaves/${id}`, { status });
  return data;
}

export async function updateLeave(id: number, payload: LeaveInput): Promise<Leave> {
  const { data } = await apiClient.put<Leave>(`/leaves/${id}`, payload);
  return data;
}

export async function deleteLeave(id: number): Promise<void> {
  await apiClient.delete(`/leaves/${id}`);
}
