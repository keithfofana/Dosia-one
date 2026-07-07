import { apiClient } from './client';
import type { TwoFactorSetup } from '../types/models';

export async function enableTwoFactor(): Promise<TwoFactorSetup> {
  const { data } = await apiClient.post<TwoFactorSetup>('/auth/2fa/enable');
  return data;
}

export async function confirmTwoFactor(code: string): Promise<void> {
  await apiClient.post('/auth/2fa/confirm', { code });
}

export async function disableTwoFactor(password: string): Promise<void> {
  await apiClient.post('/auth/2fa/disable', { password });
}
