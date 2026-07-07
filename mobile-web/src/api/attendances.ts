import { apiClient } from './client';
import type { Attendance, PaginatedResponse } from '../types/models';

export interface AttendanceInput {
  employee_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
}

export async function listAttendances(): Promise<PaginatedResponse<Attendance>> {
  const { data } = await apiClient.get<PaginatedResponse<Attendance>>('/attendances');
  return data;
}

export async function createAttendance(payload: AttendanceInput): Promise<Attendance> {
  const { data } = await apiClient.post<Attendance>('/attendances', payload);
  return data;
}

export async function updateAttendanceCheckOut(id: number, checkOut: string): Promise<Attendance> {
  const { data } = await apiClient.put<Attendance>(`/attendances/${id}`, { check_out: checkOut });
  return data;
}
