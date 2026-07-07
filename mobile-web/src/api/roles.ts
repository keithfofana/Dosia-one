import { apiClient } from './client';
import type { PaginatedResponse, Permission, Role } from '../types/models';

export async function listRoles(): Promise<PaginatedResponse<Role>> {
  const { data } = await apiClient.get<PaginatedResponse<Role>>('/roles');
  return data;
}

export async function createRole(name: string, permissionIds: number[]): Promise<Role> {
  const { data } = await apiClient.post<Role>('/roles', { name, permission_ids: permissionIds });
  return data;
}

export async function updateRolePermissions(id: number, permissionIds: number[]): Promise<Role> {
  const { data } = await apiClient.put<Role>(`/roles/${id}`, { permission_ids: permissionIds });
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}

export async function listPermissions(): Promise<Permission[]> {
  const { data } = await apiClient.get<Permission[]>('/permissions');
  return data;
}
