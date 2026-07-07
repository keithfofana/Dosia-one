import { apiClient } from './client';
import type { PaginatedResponse, User } from '../types/models';

export interface UserInput {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role_id?: number | null;
}

export async function listUsers(): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get<PaginatedResponse<User>>('/users');
  return data;
}

export async function createUser(payload: UserInput): Promise<User> {
  const { data } = await apiClient.post<User>('/users', payload);
  return data;
}

export async function setUserActive(id: number, isActive: boolean): Promise<User> {
  const { data } = await apiClient.put<User>(`/users/${id}`, { is_active: isActive });
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
