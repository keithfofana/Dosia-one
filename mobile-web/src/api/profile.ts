import { apiClient } from './client';
import type { User } from '../types/models';

export async function updateLocale(locale: string): Promise<User> {
  const { data } = await apiClient.patch<User>('/profile/locale', { locale });
  return data;
}
